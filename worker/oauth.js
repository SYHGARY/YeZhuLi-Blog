// ============================================================
// Decap CMS GitHub OAuth 代理（Cloudflare Worker）
// 密钥通过 Cloudflare 后台的 Variables and Secrets 设置：
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET
// ============================================================

function renderBody(status, content) {
  const html = `
<script>
const receiveMessage = (message) => {
  window.opener.postMessage(
    'authorization:github:${status}:${JSON.stringify(content)}',
    message.origin
  );
  window.removeEventListener("message", receiveMessage, false);
}
window.addEventListener("message", receiveMessage, false);
window.opener.postMessage("authorizing:github", "*");
</script>`;
  return html;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1: Decap 弹窗打开 /auth，跳到 GitHub 授权页
    if (url.pathname === '/auth') {
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', url.origin + '/callback');
      authUrl.searchParams.set('scope', 'repo user');
      authUrl.searchParams.set('state', crypto.randomUUID());
      return Response.redirect(authUrl.toString(), 302);
    }

    // Step 2: GitHub 回调 /callback，换取 token 并传回 Decap
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'cf-pages-oauth',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code
        })
      });
      const result = await tokenResponse.json();

      if (result.error) {
        return new Response(renderBody('error', result), {
          headers: { 'content-type': 'text/html;charset=UTF-8' },
          status: 401
        });
      }

      const token = result.access_token;
      return new Response(renderBody('success', { token, provider: 'github' }), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
        status: 200
      });
    }

    return new Response('OAuth Worker - visit /auth to begin', { status: 200 });
  }
};
