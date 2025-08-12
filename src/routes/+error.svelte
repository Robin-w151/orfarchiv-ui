<script lang="ts">
  import { page } from '$app/state';
  import { error, redirect } from '@sveltejs/kit';

  const path = page.url.pathname as string;
  if (path === '/favicon.ico') {
    error(404, 'Not found');
  }

  redirect(302, '/');
</script>
