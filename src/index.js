import React, { useEffect, useLayoutEffect, useRef } from "react"
import ResizeObserver from "resize-observer-polyfill"

const SCROLLING_UP = 0
const SCROLLING_DOWN = 1

const NOT_VISIBLE = 0
const PARTIALLY_VISIBLE = 1
const ENTIRELY_VISIBLE = 2

const MAX_STYLE = { maxWidth: "100%" }
const PARENT_STYLE = { position: "relative", ...MAX_STYLE }
const CHILD_STYLE = {
  width: "100%",
  position: "absolute",
  zIndex: "4000",
  ...MAX_STYLE
}
const PLACEHOLDER_STYLE = { ...MAX_STYLE }

const MUTATION_CONFIG = { childList: true, subtree: true }
const SCROLLING_DOWN_CLASS = "scrolling-down"
const SCROLLING_UP_CLASS = "scrolling-up"

const PeekElement = function(props) {
  const containerRef = useRef()
  const childRef = useRef()
  const placeHolderRef = useRef()
  const { usePlaceHolder, zIndex = CHILD_STYLE.zIndex } = props

  const alreadyHandling = React.useRef()
  const lastScrollPosition = React.useRef()
  const scrollDirection = React.useRef()
  const visibilityState = React.useRef()

  const positionChild = React.useCallback(() => {
    if (alreadyHandling.current) {
      return
    }
    alreadyHandling.current = true

    window.requestAnimationFrame(() => {
      alreadyHandling.current = false

      const isZoomed =
        window.visualViewport && window.visualViewport.scale !== 1
      const child = childRef.current
      const parent = containerRef.current
      const childRect = child.getBoundingClientRect()

      if (!child || !parent) {
        return
      }
      if (isZoomed) {
        child.style.position = "absolute"
        child.style.top = "0"
        return
      }

      if (scrollDirection.current === SCROLLING_DOWN) {
        child.setAttribute("class", SCROLLING_DOWN_CLASS)

        if (
          window.scrollY > child.offsetTop &&
          child.style.position === "fixed"
        ) {
          child.style.position = "absolute"
          child.style.top = lastScrollPosition.current + "px"
        }
      }

      if (scrollDirection.current === SCROLLING_UP) {
        child.setAttribute(
          "class",
          window.scrollY === 0 ? "" : SCROLLING_UP_CLASS
        )

        if (visibilityState.current === NOT_VISIBLE) {
          child.style.position = "absolute"
          child.style.top = window.scrollY - childRect.height + 2 + "px"
        }

        if (visibilityState.current === ENTIRELY_VISIBLE) {
          child.style.position = "fixed"
          child.style.top = "0"
        }
      }

      window.requestAnimationFrame(() => {
        child.style.width = parent.offsetWidth + "px"
        if (usePlaceHolder) {
          placeHolderRef.current.style.width = childRect.width + "px"
          placeHolderRef.current.style.height = childRect.height + "px"
        }
      })

      lastScrollPosition.current = window.scrollY
    })
  }, [usePlaceHolder, visibilityState])

  const handleRepositionAction = React.useCallback(() => {
    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    const partially =
      childRect.top < 0 && Math.abs(childRect.top) < childRect.height
    const entirely = childRect.top > -1
    if (lastScrollPosition.current > window.scrollY) {
      scrollDirection.current = SCROLLING_UP
    }
    if (lastScrollPosition.current < window.scrollY) {
      scrollDirection.current = SCROLLING_DOWN
    }
    if (partially) {
      visibilityState.current = PARTIALLY_VISIBLE
    }
    if (entirely) {
      visibilityState.current = ENTIRELY_VISIBLE
    }
    if (!partially && !entirely) {
      visibilityState.current = NOT_VISIBLE
    }

    positionChild()
  }, [positionChild])

  useLayoutEffect(() => positionChild(), [childRef, positionChild])
  useEffect(() => {
    const containerNode = containerRef.current
    const sizeObserver = new ResizeObserver(handleRepositionAction)
    const domObserver = new MutationObserver(handleRepositionAction)
    sizeObserver.observe(containerNode)
    domObserver.observe(containerNode, MUTATION_CONFIG)

    window.addEventListener("scroll", handleRepositionAction)
    window.addEventListener("resize", handleRepositionAction)
    positionChild()

    return () => {
      sizeObserver.disconnect()
      domObserver.disconnect()
      window.removeEventListener("scroll", handleRepositionAction)
      window.removeEventListener("resize", handleRepositionAction)
    }
  }, [containerRef, handleRepositionAction, positionChild])

  return (
    <div style={PARENT_STYLE} ref={containerRef}>
      <div style={{ ...CHILD_STYLE, zIndex }} ref={childRef}>
        {props.children}
      </div>
      {usePlaceHolder && <div ref={placeHolderRef} style={PLACEHOLDER_STYLE} />}
    </div>
  )
}

export default PeekElement
