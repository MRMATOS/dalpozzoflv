import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Inicialização mais robusta
    const checkIsMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(checkIsMobile())
    }
    
    // Definir estado inicial
    setIsMobile(checkIsMobile())
    setIsInitialized(true)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Durante o SSR ou antes da inicialização, assumir desktop
  return isInitialized ? isMobile : false
}
