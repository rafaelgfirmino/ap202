<script lang="ts">
  import logo from '$lib/assets/logo.png'

  let { class: className = '', ...rest } = $props<{
    class?: string
  }>()
</script>

<img
  id="landing-brand-mark-image"
  src={logo}
  alt="Ap202"
  class={`block w-auto object-contain ${className}`}
  {...rest}
/>