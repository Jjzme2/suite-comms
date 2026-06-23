export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/auth')) return

  const user = useCurrentUser()

  if (user.value === undefined) {
    await new Promise<void>(resolve => {
      const stop = watch(user, val => {
        if (val !== undefined) { stop(); resolve() }
      })
    })
  }

  if (!user.value) {
    const config = useRuntimeConfig()
    const callback = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(
      `${config.public.hubUrl}/auth/login?callback=${callback}&redirect=${redirect}`,
      { external: true }
    )
  }
})
