import React, { useEffect, useRef, useCallback } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

const MAX_STYLE = { maxWidth: '100%' }
const PARENT_STYLE = { position: 'relative', ...MAX_STYLE }
const PLACEHOLDER_STYLE = { ...MAX_STYLE }
const CHILD_STYLE = {
  width: '100%',
  position: 'fixed',
  zIndex: '4000',
  ...MAX_STYLE,
}

const SCROLLING_DOWN_CLASS = 'scrolling-down'
const SCROLLING_UP_CLASS = 'scrolling-up'

const PeekElement = function (props) {
  const containerRef = useRef()
  const childRef = useRef()
  const placeHolderRef = useRef()
  const { config } = props
  const {
    sizeListener = Function.prototype,
    revealDuration = 0,
    placeHolderProps = {},
    parentProps = {},
    childProps = {},
  } = config || {}

  const lastScrollPosition = React.useRef(window.scrollY)
  const scrollDelta = React.useRef(0)
  const childHeight = React.useRef(0)
  const childWidth = React.useRef(0)
  const childTop = React.useRef(0)
  const inProcess = React.useRef(false)

  const handleRepositionAction = useCallback(() => {
    if (inProcess.current) { return }
    inProcess.current = true

    const child = childRef.current
    const childRect = child.getBoundingClientRect()
    const parentRect = containerRef.current.getBoundingClientRect()
    const scrollingUp = lastScrollPosition.current > window.scrollY
    const scrollingDown = lastScrollPosition.current < window.scrollY

    let newChildTop = childTop.current
    scrollDelta.current = Math.abs(lastScrollPosition.current - window.scrollY)

    if (scrollingUp) {
      child.classList.add(SCROLLING_UP_CLASS)
      child.classList.remove(SCROLLING_DOWN_CLASS)
      newChildTop += scrollDelta.current
    } else if (scrollingDown) {
      child.classList.add(SCROLLING_DOWN_CLASS)
      child.classList.remove(SCROLLING_UP_CLASS)
      newChildTop -= scrollDelta.current
    }

    if (window.scrollY === 0) {
      child.classList.remove(SCROLLING_UP_CLASS)
    }

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
    inProcess.current = false
  }, [sizeListener])

  useEffect(() => {
    const containerNode = containerRef.current
    const sizeObserver = new ResizeObserver(handleRepositionAction)
    sizeObserver.observe(containerNode)
    window.addEventListener('scroll', handleRepositionAction)
    window.addEventListener('resize', handleRepositionAction)
    handleRepositionAction()

    return () => {
      sizeObserver.disconnect()
      window.removeEventListener('scroll', handleRepositionAction)
      window.removeEventListener('resize', handleRepositionAction)
    }
  }, [containerRef, handleRepositionAction])

  const parentStyle = { ...PARENT_STYLE, ...(parentProps?.style || {}) }
  const childStyle = { ...CHILD_STYLE, ...(childProps?.style || {}) }
  const placeHolderStyle = { ...PLACEHOLDER_STYLE, ...(placeHolderProps?.style || {}) }

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

  const api = {
    hide: () => animateTo(-childHeight?.current),
    show: () => animateTo(0),
  }

  const renderChildren = (children) => typeof children === 'function' ? children(api) : children

  return (
    <div ref={containerRef} {...parentProps} style={parentStyle}>
      <div ref={childRef} {...childProps} style={childStyle}>
        {renderChildren(props.children)}
      </div>
      <div ref={placeHolderRef} {...placeHolderProps} style={placeHolderStyle} />
    </div>
  )
}
export default PeekElement
