import React, { useLayoutEffect, useRef, useCallback, ReactNode } from "react";
import { PARENT_STYLE, CHILD_STYLE, PLACEHOLDER_STYLE, SCROLLING_DOWN_CLASS, SCROLLING_UP_CLASS } from "./constants";

type ChildFNProps = {
  show: () => void;
  hide: () => void;
};

export type PeekProps = {
  config?: {
    sizeListener?: (rect: DOMRect) => void;
    revealDuration?: number;
    placeHolderProps?: React.ComponentPropsWithoutRef<"div">;
    parentProps?: React.ComponentPropsWithoutRef<"div">;
    childProps?: React.ComponentPropsWithoutRef<"div">;
  };
  children: ReactNode | ((api: ChildFNProps) => ReactNode);
};

const PeekElement = function (props: PeekProps) {
  const { config } = props;
  const { sizeListener = Function.prototype, revealDuration = 0 } = config || {};
  const { placeHolderProps = {}, parentProps = {}, childProps = {} } = config || {};

  const placeHolderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const scrollDelta = React.useRef(0);
  const childHeight = React.useRef(0);
  const childWidth = React.useRef(0);
  const childTop = React.useRef(0);
  const lastScrollPosition = React.useRef(window.scrollY);

  const handleRepositionAction = useCallback(() => {
    if (!childRef.current || !containerRef.current || !placeHolderRef.current) return;

    const child = childRef.current;
    const childRect = child.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    const scrollY = Math.max(0, window.scrollY);
    const scrollingUp = lastScrollPosition.current > scrollY;
    const scrollingDown = lastScrollPosition.current < scrollY;
    let newClass,
      oldClass,
      newChildTop = childTop.current;

    scrollDelta.current = Math.abs(lastScrollPosition.current - Math.max(0, scrollY));

    if (scrollingUp) {
      newClass = SCROLLING_UP_CLASS;
      oldClass = SCROLLING_DOWN_CLASS;
      newChildTop += scrollDelta.current;
    } else if (scrollingDown) {
      newClass = SCROLLING_DOWN_CLASS;
      oldClass = SCROLLING_UP_CLASS;
      newChildTop -= scrollDelta.current;
    }

    if (scrollY === 0) oldClass = SCROLLING_UP_CLASS;
    if (newClass && !child.classList.contains(newClass)) child.classList.add(newClass);
    if (oldClass && child.classList.contains(oldClass)) child.classList.remove(oldClass);

    newChildTop = Math.min(0, Math.max(-childRect.height, newChildTop));

    if (newChildTop !== childTop.current) {
      childTop.current = newChildTop;
      child.style.transform = `translateY(${childTop.current}px)`;
    }

    const dimensionsChanged = childWidth.current !== parentRect.width || childHeight.current !== childRect.height;

    if (dimensionsChanged) {
      placeHolderRef.current.style.width = parentRect.width + "px";
      placeHolderRef.current.style.height = childRect.height + "px";
      childRef.current.style.width = parentRect.width + "px";
      childHeight.current = childRect.height;
      childWidth.current = parentRect.width;
    }

    lastScrollPosition.current = scrollY;
    sizeListener(childRect);
  }, [sizeListener]);

  useLayoutEffect(() => {
    if (!childRef.current) return;
    const childNode = childRef.current;
    const sizeObserver = new ResizeObserver(handleRepositionAction);
    sizeObserver.observe(childNode);

    window.addEventListener("scroll", handleRepositionAction);
    window.addEventListener("resize", handleRepositionAction);
    handleRepositionAction();

    return () => {
      sizeObserver.disconnect();
      window.removeEventListener("scroll", handleRepositionAction);
      window.removeEventListener("resize", handleRepositionAction);
    };
  }, [handleRepositionAction]);

  const animateTo = useCallback(
    (to: number) => {
      const child = childRef?.current;
      if (!child || childTop.current === to) return;

      if (!revealDuration) {
        childTop.current = to;
        Object.assign(child.style, { transform: `translateY(${to + "px"})` });
        return;
      }

      const transition = `transform ${revealDuration}ms linear`;
      Object.assign(child.style, { transition });

      window.requestAnimationFrame(() => {
        childTop.current = to;
        child.style.transform = `translateY(${childTop.current + "px"})`;
      });
      window.setTimeout(() => {
        child.style.transition = "";
      }, revealDuration * 2);
    },
    [revealDuration]
  );

  const show = useCallback(() => animateTo(0), [animateTo]);
  const hide = useCallback(() => animateTo(-childHeight?.current), [animateTo]);

  const parentStyle = { ...PARENT_STYLE, ...(parentProps?.style || {}) };
  const childStyle = { ...CHILD_STYLE, ...(childProps?.style || {}) };
  const placeHolderStyle = { ...PLACEHOLDER_STYLE, ...(placeHolderProps?.style || {}) };
  const api = { show, hide };

  return (
    <div ref={containerRef} {...parentProps} style={parentStyle}>
      <div ref={childRef} {...childProps} style={{ ...childStyle }}>
        {/* eslint-disable-next-line react-hooks/refs */}
        {typeof props.children === "function" ? props.children(api) : props.children}
      </div>
      <div ref={placeHolderRef} {...placeHolderProps} style={placeHolderStyle} />
    </div>
  );
};

export default PeekElement;
