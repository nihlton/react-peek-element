import React, { useEffect, useRef } from 'react'
import { elementInViewport, elementPartiallyInViewport } from './util'

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
  
  useEffect(() => {
    window.addEventListener('scroll', handleScrollAction)
    window.addEventListener('resize', handleScrollAction)
    positionChild()
    
    return () => {
      visibleObserver.disconnect()
      window.removeEventListener('scroll', handleScrollAction)
      window.removeEventListener('resize', handleScrollAction)
    }
  }, [ ])
  
  const handleScrollAction = () => {
    const child = childRef.current
    const grandChild = child.firstElementChild
    const partially = elementPartiallyInViewport(grandChild)
    const entirely = elementInViewport(grandChild)
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
      const grandChild = child.firstElementChild
  
      
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
          child.style.top = (window.scrollY - grandChild.offsetHeight + 2) + 'px'
        }
        
        if (visibilityState === ENTIRELY_VISIBLE) {
          child.style.position = 'fixed'
          child.style.top = '0px'
          child.style.zIndex = '33'
        }
        child.setAttribute('class', window.scrollY === 0 ? '' : 'scrolling-up')
      }
  
      usePlaceHolder && window.requestAnimationFrame(() => {
        placeHolderRef.current.style.width = grandChild.offsetWidth + 'px'
        placeHolderRef.current.style.height = grandChild.offsetHeight + 'px'
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