/**
 * Tooltip - Unified tooltip component with smart positioning
 *
 * Features:
 * - Smart positioning that avoids viewport edges
 * - Hoverable/interactive (can move cursor into tooltip)
 * - Scrollable content for long tooltips
 * - Consistent styling across the app
 * - Powered by Floating UI for robust positioning
 */

import React, { useState, useRef, cloneElement, ReactElement } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
  safePolygon,
} from '@floating-ui/react';

export interface TooltipProps {
  /** The content to show in the tooltip */
  content: React.ReactNode;

  /** The element that triggers the tooltip (must accept ref and event handlers) */
  children: ReactElement;

  /** Placement preference (will auto-flip if doesn't fit) */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /** Offset from trigger element in pixels */
  offset?: number;

  /** Max width of tooltip */
  maxWidth?: number;

  /** Max height of tooltip (content will scroll if exceeded) */
  maxHeight?: number;

  /** Delay before showing tooltip (ms) */
  delay?: number;

  /** Whether tooltip is disabled */
  disabled?: boolean;

  /** Additional className for tooltip content */
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  offset: offsetValue = 8,
  maxWidth = 300,
  maxHeight = 300,
  delay = 200,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const {
    refs,
    floatingStyles,
    context,
    middlewareData,
  } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: {
      open: delay,
      close: 0,
    },
    move: false,
    handleClose: safePolygon({
      requireIntent: false,
    }),
  });

  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  if (disabled) {
    return children;
  }

  return (
    <>
      {cloneElement(children, getReferenceProps({
        ref: refs.setReference,
      }))}

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              maxWidth,
              maxHeight,
              width: 'max-content',
              zIndex: 10000,
            }}
            {...getFloatingProps()}
            className={`tooltip-floating ${className}`}
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill="white"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            {content}

            <style>{`
              .tooltip-floating {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                font-size: 13px;
                line-height: 1.5;
                color: #1e293b;
                overflow-y: auto;
              }

              .tooltip-floating::-webkit-scrollbar {
                width: 8px;
              }

              .tooltip-floating::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }

              .tooltip-floating::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }

              .tooltip-floating::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
