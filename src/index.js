import React, { useEffect, useLayoutEffect, useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

const SCROLLING_UP = 0
const SCROLLING_DOWN = 1

const NOT_VISIBLE = 0
const PARTIALLY_VISIBLE = 1
const ENTIRELY_VISIBLE = 2

const maxStyle = { maxWidth: '100%' }
const parentStyle = { position: 'relative', ...maxStyle }
const childStyle = { width: '100%', position: 'absolute', zIndex: '4000', ...maxStyle }
const placeHolderStyle = { ...maxStyle }

const mutationConfig = { childList: true, subtree: true }
const SCROLLING_DOWN_CLASS = 'scrolling-down'
const SCROLLING_UP_CLASS = 'scrolling-up'

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
    const sizeObserver = new ResizeObserver(handleRepositionAction)
    const domObserver = new MutationObserver(handleRepositionAction)
    sizeObserver.observe(containerNode)
    domObserver.observe(containerNode, mutationConfig)
    
    window.addEventListener('scroll', handleRepositionAction)
    window.addEventListener('resize', handleRepositionAction)
    positionChild()
    
    return () => {
      sizeObserver.disconnect()
      domObserver.disconnect()
      window.removeEventListener('scroll', handleRepositionAction)
      window.removeEventListener('resize', handleRepositionAction)
    }
  }, [ containerRef ])
  
  const handleRepositionAction = () => {
    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    const partially = childRect.top < 0 && (Math.abs(childRect.top) < childRect.height)
    const entirely = childRect.top > -1
    if (lastScrollPosition > window.scrollY) { scrollDirection = SCROLLING_UP }
    if (lastScrollPosition < window.scrollY) { scrollDirection = SCROLLING_DOWN }
    if (partially) { visibilityState = PARTIALLY_VISIBLE }
    if (entirely) { visibilityState = ENTIRELY_VISIBLE }
    if (!partially && !entirely) { visibilityState = NOT_VISIBLE }
    
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
        child.style.top = '0'
        return
      }
  
      if (scrollDirection === SCROLLING_DOWN) {
        child.setAttribute('class', SCROLLING_DOWN_CLASS)
        
        if (window.scrollY > child.offsetTop && child.style.position === 'fixed') {
          child.style.position = 'absolute'
          child.style.top = (window.scrollY + 1) + 'px'
        }
      }
  
      if (scrollDirection === SCROLLING_UP) {
        child.setAttribute('class', window.scrollY === 0 ? '' : SCROLLING_UP_CLASS)
        
        if (visibilityState === NOT_VISIBLE) {
          child.style.position = 'absolute'
          child.style.top = (window.scrollY - childRect.height + 2) + 'px'
        }
        
        if (visibilityState === ENTIRELY_VISIBLE) {
          child.style.position = 'fixed'
          child.style.top = '0'
        }
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