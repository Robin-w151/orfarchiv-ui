<script lang="ts" module>
  import { inject } from '@vercel/analytics';
  import { injectSpeedInsights } from '@vercel/speed-insights';
  import { browser } from '$app/environment';
  import { PUBLIC_ENABLE_ANALYTICS } from '$env/static/public';

  function isAnalyticsEnabled(): boolean {
    return PUBLIC_ENABLE_ANALYTICS === 'true';
  }

  if (browser && isAnalyticsEnabled()) {
    inject();
    injectSpeedInsights();
  }
</script>
