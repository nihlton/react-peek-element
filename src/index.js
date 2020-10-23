import React, { useEffect, useRef, useCallback } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import {
  PARENT_STYLE, CHILD_STYLE, PLACEHOLDER_STYLE,
  SCROLLING_DOWN_CLASS, SCROLLING_UP_CLASS,
} from './constants'

const PeekElement = function (props) {
  const { config } = props
  const { sizeListener = Function.prototype, revealDuration = 0, } = config || {}
  const { placeHolderProps = {}, parentProps = {}, childProps = {}, } = config || {}

  const placeHolderRef = useRef(null)
  const containerRef = useRef(null)
  const childRef = useRef(null)
  const scrollDelta = React.useRef(0)
  const childHeight = React.useRef(0)
  const childWidth = React.useRef(0)
  const childTop = React.useRef(0)
  const lastScrollPosition = React.useRef(window.scrollY)

  const handleRepositionAction = useCallback(() => {

    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    const parentRect = containerRef.current.getBoundingClientRect()
    const scrollingUp = lastScrollPosition.current > window.scrollY
    const scrollingDown = lastScrollPosition.current < window.scrollY
    let newClass, oldClass, newChildTop = childTop.current

    scrollDelta.current = Math.abs(lastScrollPosition.current - window.scrollY)

    if (scrollingUp) {
      newClass = SCROLLING_UP_CLASS
      oldClass = SCROLLING_DOWN_CLASS
      newChildTop += scrollDelta.current
    } else if (scrollingDown) {
      newClass = SCROLLING_DOWN_CLASS
      oldClass = SCROLLING_UP_CLASS
      newChildTop -= scrollDelta.current
    }

    if (window.scrollY === 0) {
      oldClass = SCROLLING_UP_CLASS
    }

    newClass && !child.classList.contains(newClass) && child.classList.add(newClass)
    oldClass && child.classList.contains(oldClass) && child.classList.remove(oldClass)
    newChildTop = Math.min(0, Math.max(-childRect.height, newChildTop))

    if (newChildTop !== childTop.current) {
      childTop.current = newChildTop
      child.style.transform = `translateY(${childTop.current}px)`
    }

    const dimensionsChanged = (childWidth.current !== parentRect.width || childHeight.current !== childRect.height)

    if (dimensionsChanged) {
      placeHolderRef.current.style.width = parentRect.width + 'px'
      placeHolderRef.current.style.height = childRect.height + 'px'
      childRef.current.style.width = parentRect.width + 'px'
      childHeight.current = childRect.height
      childWidth.current = parentRect.width
    }

    lastScrollPosition.current = window.scrollY
    sizeListener(childRect)

  }, [sizeListener])

  useEffect(() => {
    const childNode = childRef.current
    const sizeObserver = new ResizeObserver(handleRepositionAction)
    sizeObserver.observe(childNode)

    window.addEventListener('scroll', handleRepositionAction)
    window.addEventListener('resize', handleRepositionAction)
    handleRepositionAction()

    return () => {
      sizeObserver.disconnect()
      window.removeEventListener('scroll', handleRepositionAction)
      window.removeEventListener('resize', handleRepositionAction)
    }
  }, [childRef, handleRepositionAction])

  const animateTo = (to) => {
    const child = childRef?.current

    if (child && childTop.current !== to) {
      child.style.transition = `transform ${revealDuration}ms linear`

      window.requestAnimationFrame(() => {
        childTop.current = to
        child.style.transform = `translateY(${childTop.current + 'px'})`
      })
      window.setTimeout(() => { child.style.transition = '' }, revealDuration * 2)
    }
  }

  const parentStyle = { ...PARENT_STYLE, ...(parentProps?.style || {}) }
  const childStyle = { ...CHILD_STYLE, ...(childProps?.style || {}) }
  const placeHolderStyle = { ...PLACEHOLDER_STYLE, ...(placeHolderProps?.style || {}) }
  const api = { show: () => animateTo(0), hide: () => animateTo(-childHeight?.current), }

  return (
    <div ref={containerRef} {...parentProps} style={parentStyle}>
      <div ref={childRef} {...childProps} style={childStyle}>
        { typeof props.children === 'function' ? props.children(api) : props.children }
      </div>
      <div ref={placeHolderRef} {...placeHolderProps} style={placeHolderStyle} />
    </div>
  )
}
export default PeekElement
