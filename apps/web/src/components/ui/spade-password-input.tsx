"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { m, AnimatePresence } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SpadePasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  showToggle?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const SpadePasswordInput = React.forwardRef<HTMLInputElement, SpadePasswordInputProps>(
  ({ className, showToggle = true, value = "", onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value)
    const [isFocused, setIsFocused] = React.useState(false)
    const [isTyping, setIsTyping] = React.useState(false)
    const hiddenInputRef = React.useRef<HTMLInputElement>(null)
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    // Sync internal value with prop value
    React.useEffect(() => {
      setInternalValue(value)
    }, [value])

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }, [])

    const handleDisplayClick = () => {
      // Focus the hidden input when display is clicked
      hiddenInputRef.current?.focus()
      setIsFocused(true)
    }

    const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      
      // Trigger typing animation
      setIsTyping(true)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 800)
      
      if (onChange) {
        // Create a synthetic event for the parent
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    const handleBlur = () => {
      setIsFocused(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (props.onKeyDown) {
        props.onKeyDown(e)
      }
    }


    return (
      <div className="relative">
        {/* Hidden actual input for form functionality */}
        <input
          ref={(el) => {
            hiddenInputRef.current = el;
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref) {
              ref.current = el;
            }
          }}
          type="password"
          value={internalValue}
          onChange={handleHiddenInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
          {...props}
        />
        
        {/* Display input that shows spades with premium effects */}
        <m.div
          onClick={handleDisplayClick}
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground focus-within:outline-none cursor-text relative overflow-hidden",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isFocused && "ring-2 ring-sky-400/30 border-sky-400/50",
            isTyping && "ring-2 ring-fuchsia-400/40 border-fuchsia-400/60",
            className
          )}
          animate={{
            scale: isTyping ? 1.01 : 1,
            boxShadow: isFocused 
              ? "0 0 20px rgba(56, 189, 248, 0.15)" 
              : isTyping 
              ? "0 0 25px rgba(232, 121, 249, 0.2)" 
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Premium glow effect when typing */}
          <AnimatePresence>
            {isTyping && (
              <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-fuchsia-400/10 to-sky-400/10 rounded-md pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Spade characters with individual animations */}
          <div className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 flex items-center justify-center">
            {showPassword ? (
              <span className="text-center w-full">{internalValue}</span>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <AnimatePresence mode="popLayout">
                  {internalValue.split('').map((_, index) => (
                    <m.span
                      key={`spade-${index}`}
                      initial={{ opacity: 0, scale: 0.5, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: index * 0.05
                      }}
                      className="text-white"
                      style={{
                        fontSize: '1em', // Slightly smaller spades
                        textShadow: isFocused ? '0 0 8px rgba(255, 255, 255, 0.3)' : undefined
                      }}
                    >
                      ♠
                    </m.span>
                  ))}
                </AnimatePresence>
                {internalValue.length === 0 && props.placeholder && (
                  <span className="text-muted-foreground text-center w-full">
                    {props.placeholder}
                  </span>
                )}
              </div>
            )}
          </div>
        </m.div>

        {showToggle && internalValue.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={props.disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        )}
      </div>
    )
  }
)
SpadePasswordInput.displayName = "SpadePasswordInput"

export { SpadePasswordInput }