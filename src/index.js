import React, { useEffect, useRef, useCallback } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

const MAX_STYLE = { maxWidth: '100%' }
const PARENT_STYLE = { position: 'relative', ...MAX_STYLE }
const PLACEHOLDER_STYLE = { ...MAX_STYLE }
const CHILD_STYLE = {
  width: '100%',
  position: 'fixed',
  zIndex: '4000',
  ...MAX_STYLE
}

const MUTATION_CONFIG = { childList: true, subtree: true }
const SCROLLING_DOWN_CLASS = 'scrolling-down'
const SCROLLING_UP_CLASS = 'scrolling-up'

const PeekElement = function (props) {
  const containerRef = useRef()
  const childRef = useRef()
  const placeHolderRef = useRef()
  const { config } = props
  const {
    revealDuration,
    childProps,
    parentProps,
    placeHolderProps,
    sizeListener = Function.prototype
  } = config || {}
  
  const lastScrollPosition = React.useRef(window.scrollY)
  const inProcess = React.useRef(false)
  const scrollDelta = React.useRef(0)
  const childTop = React.useRef(0)
  const childHeight = React.useRef(0)
  const childWidth = React.useRef(0)
  
  const handleRepositionAction = useCallback(() => {
    if (inProcess.current) { return }
    inProcess.current = true
    
    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    let newChildTop = childTop.current
    scrollDelta.current = Math.abs(lastScrollPosition.current - window.scrollY)
    
    // scrolling up
    if (lastScrollPosition.current > window.scrollY) {
      child.classList.add(SCROLLING_DOWN_CLASS)
      child.classList.remove(SCROLLING_UP_CLASS)
      newChildTop += scrollDelta.current
    }
    
    // scrolling down
    if (lastScrollPosition.current < window.scrollY) {
      child.classList.add(SCROLLING_UP_CLASS)
      child.classList.remove(SCROLLING_DOWN_CLASS)
      newChildTop -= scrollDelta.current
    }
    
    newChildTop = Math.min(0, Math.max(-childRect.height, newChildTop))
    
    if (newChildTop !== childTop.current) {
      childTop.current = newChildTop
      child.style.transform = `translateY(${childTop.current}px)`
    }
    
    lastScrollPosition.current = window.scrollY
    
    const childDimensionsChanged = (childWidth.current !== childRect.width || childHeight.current !== childRect.height)
    
    if (childDimensionsChanged) {
      placeHolderRef.current.style.width = childRect.width + 'px'
      placeHolderRef.current.style.height = childRect.height + 'px'
      childWidth.current = childRect.width
      childHeight.current = childRect.heigh
    }
    
    sizeListener(childRect)
    inProcess.current = false
  }, [sizeListener])
  
  useEffect(() => {
    const containerNode = containerRef.current
    const sizeObserver = new ResizeObserver(handleRepositionAction)
    const domObserver = new MutationObserver(handleRepositionAction)
    sizeObserver.observe(containerNode)
    domObserver.observe(containerNode, MUTATION_CONFIG)
    window.addEventListener('scroll', handleRepositionAction)
    window.addEventListener('resize', handleRepositionAction)
    handleRepositionAction()
    
    return () => {
      sizeObserver.disconnect()
      domObserver.disconnect()
      window.removeEventListener('scroll', handleRepositionAction)
      window.removeEventListener('resize', handleRepositionAction)
    }
  }, [containerRef, handleRepositionAction])
  
  const parentStyle = { ...PARENT_STYLE, ...(parentProps?.style || {}) }
  const childStyle = { ...CHILD_STYLE, ...(childProps?.style || {}) }
  const placeHolderStyle = { ...PLACEHOLDER_STYLE, ...(placeHolderProps?.style || {}) }
  
  const api = {
    hide: () => {
      const child = childRef.current
      const childRect = child?.getBoundingClientRect()
      if (child && childTop.current !== -childRect.height) {
        child.style.transform = `translateY(${childTop.current + 'px'})`
        child.style.transition = `transform ${revealDuration}ms linear`
        window.requestAnimationFrame(() => {
          childTop.current = -childRect.height
          child.style.transform = `translateY(${childTop.current + 'px'})`
        })
        window.setTimeout(() => { child.style.transition = '' }, revealDuration * 2)
      }
    },
    show: () => {
      const child = childRef.current
      if (child && childTop.current !== 0) {
        child.style.transform = `translateY(${childTop.current + 'px'})`
        child.style.transition = `transform ${revealDuration}ms linear`
        window.requestAnimationFrame(() => {
          childTop.current = 0
          child.style.transform = `translateY(${childTop.current + 'px'})`
        })
        window.setTimeout(() => { child.style.transition = '' }, revealDuration * 2)
      }
    },
  }
  
  const renderChildren = children => {
    if (typeof children === 'function') {
      return props.children(api)
    } else {
      return children
    }
  }
  
  return (
    <div ref={containerRef} {...parentProps} style={parentStyle} >
      <div ref={childRef} {...childProps} style={childStyle} >{renderChildren(props.children)}</div>
      <div ref={placeHolderRef} {...placeHolderProps} style={placeHolderStyle} />
    </div>
  )
}
export default PeekElement
