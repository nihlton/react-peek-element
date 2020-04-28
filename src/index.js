import React, { useEffect, useLayoutEffect, useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

const SCROLLING_UP = 0
const SCROLLING_DOWN = 1

const NOT_VISIBLE = 0
const PARTIALLY_VISIBLE = 1
const ENTIRELY_VISIBLE = 2

const maxStyle = { maxWidth: '100%' }
const parentStyle = { position: 'relative', ...maxStyle }
const childStyle = { width: '100%', position: 'absolute', ...maxStyle }
const placeHolderStyle = { ...maxStyle }

const PeekElement = function (props) {
  const containerRef = useRef()
  const childRef = useRef()
  const placeHolderRef = useRef()
  const { usePlaceHolder } = props
  
  let alreadyHandling
  let lastScrollPosition
  let scrollDirection
  let visibilityState
  
  useLayoutEffect(() => positionChild(), [ childRef ])
  useEffect(() => {
    const containerNode = containerRef.current
    const mutationConfig = { childList: true, subtree: true }
    const sizeObserver = new ResizeObserver(handleScrollAction)
    const domObserver = new MutationObserver(handleScrollAction)
    sizeObserver.observe(containerNode)
    domObserver.observe(containerNode, mutationConfig)
    
    window.addEventListener('scroll', handleScrollAction)
    window.addEventListener('resize', handleScrollAction)
    positionChild()
    
    return () => {
      sizeObserver.disconnect()
      domObserver.disconnect()
      window.removeEventListener('scroll', handleScrollAction)
      window.removeEventListener('resize', handleScrollAction)
    }
  }, [ containerRef ])
  
  const handleScrollAction = () => {
    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    const partially = childRect.top < 0 && (Math.abs(childRect.top) < childRect.height)
    const entirely = childRect.top > -1
    if (lastScrollPosition > window.scrollY) { scrollDirection = SCROLLING_UP }
    if (lastScrollPosition < window.scrollY) { scrollDirection = SCROLLING_DOWN }
    if (partially) { visibilityState = PARTIALLY_VISIBLE }
    if (entirely) { visibilityState = ENTIRELY_VISIBLE }
    if (!partially && !entirely) { visibilityState = NOT_VISIBLE }
  
    child.style.zIndex = '4000'
    
    lastScrollPosition = window.scrollY
    positionChild()
  }
  
  const positionChild = () => {
    if (alreadyHandling) { return }
    alreadyHandling = true
    
    window.requestAnimationFrame(() => {
      alreadyHandling = false
      
      const isZoomed = window.visualViewport && window.visualViewport.scale !== 1
      const child = childRef.current
      const parent = containerRef.current
      const childRect = child.getBoundingClientRect()
      
      
      if (!child || !parent) { return }
      if (isZoomed) {
        child.style.position = 'absolute'
        child.style.top = '0px'
        return
      }
  
      if (scrollDirection === SCROLLING_DOWN) {
        if (window.scrollY > child.offsetTop && child.style.position === 'fixed') {
          child.style.position = 'absolute'
          child.style.top = (window.scrollY + 1) + 'px'
        }
        child.setAttribute('class', 'scrolling-down')
      }
  
      if (scrollDirection === SCROLLING_UP) {
        if (visibilityState === NOT_VISIBLE) {
          child.style.position = 'absolute'
          child.style.top = (window.scrollY - childRect.height + 2) + 'px'
        }
        
        if (visibilityState === ENTIRELY_VISIBLE) {
          child.style.position = 'fixed'
          child.style.top = '0px'
          child.style.zIndex = '33'
        }
        child.setAttribute('class', window.scrollY === 0 ? '' : 'scrolling-up')
      }

      window.requestAnimationFrame(() => {
        child.style.width = parent.offsetWidth + 'px'
        if (usePlaceHolder) {
          placeHolderRef.current.style.width = childRect.width + 'px'
          placeHolderRef.current.style.height = childRect.height + 'px'
        }
      })
    })
  }
  
  return (
    <div style={ parentStyle } ref={containerRef}>
      <div style={childStyle} ref={childRef}>{props.children}</div>
      {usePlaceHolder && <div ref={placeHolderRef} style={placeHolderStyle} />}
    </div>
  )
  
}

export default PeekElement