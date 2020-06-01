import React, { useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

const SCROLLING_UP = 0
const SCROLLING_DOWN = 1

const NOT_VISIBLE = 0
const PARTIALLY_VISIBLE = 1
const ENTIRELY_VISIBLE = 2

const MAX_STYLE = { maxWidth: '100%' }
const PARENT_STYLE = { position: 'relative', ...MAX_STYLE }
const CHILD_STYLE = {
  width: '100%',
  position: 'absolute',
  zIndex: '4000',
  ...MAX_STYLE
}
const PLACEHOLDER_STYLE = { ...MAX_STYLE }

const MUTATION_CONFIG = { childList: true, subtree: true }
const SCROLLING_DOWN_CLASS = 'scrolling-down'
const SCROLLING_UP_CLASS = 'scrolling-up'

const PeekElement = function(props) {
  const containerRef = useRef()
  const childRef = useRef()
  const placeHolderRef = useRef()
  const { usePlaceHolder, config } = props
  
  const { childProps, parentProps, placeHolderProps } = config || {}

  const alreadyHandling = React.useRef()
  const lastScrollPosition = React.useRef()
  const scrollDirection = React.useRef()
  const visibilityState = React.useRef()

  const animationFrameMain = React.useRef()
  const animationFrameSecondary = React.useRef()

  const positionChild = useCallback(() => {
    if (alreadyHandling.current) {
      return
    }
    alreadyHandling.current = true

    animationFrameMain.current = window.requestAnimationFrame(() => {
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
        child.style.position = 'absolute'
        child.style.top = '0'
        return
      }

      if (scrollDirection.current === SCROLLING_DOWN) {
        child.classList.add(SCROLLING_DOWN_CLASS)
        child.classList.remove(SCROLLING_UP_CLASS)

        if (
          window.scrollY > child.offsetTop &&
          child.style.position === 'fixed'
        ) {
          child.style.position = 'absolute'
          child.style.top = lastScrollPosition.current + 'px'
        }
      }

      if (scrollDirection.current === SCROLLING_UP) {
        child.classList.add(SCROLLING_UP_CLASS)
        child.classList.remove(SCROLLING_DOWN_CLASS)

        if (window.scrollY === 0 ) {
          child.classList.remove(SCROLLING_UP_CLASS)
        }

        if (visibilityState.current === NOT_VISIBLE) {
          child.style.position = 'absolute'
          child.style.top = window.scrollY - childRect.height + 2 + 'px'
        }

        if (visibilityState.current === ENTIRELY_VISIBLE) {
          child.style.position = 'fixed'
          child.style.top = '0'
        }
      }

      animationFrameSecondary.current = window.requestAnimationFrame(() => {
        child.style.width = parent.offsetWidth + 'px'
        if (usePlaceHolder) {
          placeHolderRef.current.style.width = childRect.width + 'px'
          placeHolderRef.current.style.height = childRect.height + 'px'
        }
      })

      lastScrollPosition.current = window.scrollY

    })
  }, [usePlaceHolder, visibilityState])

  const handleRepositionAction = useCallback(() => {
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

    window.addEventListener('scroll', handleRepositionAction)
    window.addEventListener('resize', handleRepositionAction)
    positionChild()

    return () => {
      if (animationFrameMain.current) {
        cancelAnimationFrame(animationFrameMain.current)
      }
      if (animationFrameSecondary.current) {
        cancelAnimationFrame(animationFrameSecondary.current)
      }
      sizeObserver.disconnect()
      domObserver.disconnect()
      window.removeEventListener('scroll', handleRepositionAction)
      window.removeEventListener('resize', handleRepositionAction)
    }
  }, [containerRef, handleRepositionAction, positionChild])
  
  const parentStyle = { ...PARENT_STYLE, ...(parentProps?.style || {}) }
  const childStyle = { ...CHILD_STYLE, ...(childProps?.style || {}) }
  const placeHolderStyle = { ...PLACEHOLDER_STYLE, ...(placeHolderProps?.style || {}) }
  
  return (
    <div ref={containerRef} {...parentProps} style={parentStyle} >
      <div ref={childRef} {...childProps} style={childStyle} >{props.children}</div>
      {usePlaceHolder && <div ref={placeHolderRef} {...placeHolderProps} style={placeHolderStyle} />}
    </div>
  )
}

export default PeekElement
