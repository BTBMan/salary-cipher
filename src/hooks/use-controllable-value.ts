import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { isFunction, isNullable } from '@/utils'
import usePrevious from './use-previous'

interface Props<T> {
  value?: Nullable<T>
  defaultValue?: Nullable<T>
  onChange?: (v: Nullable<T>) => void
}

const DEFAULT_VALUE: any = ''

export function useControllableValue<T>(props?: Props<T>): [T, React.Dispatch<React.SetStateAction<Nullable<T>>>] {
  const { value, defaultValue, onChange } = props ?? {}

  const isControlled = !isNullable(value)
  const firstRenderRef = useRef(true)
  const prevValue = usePrevious(value)

  const [stateValue, setStateValue] = useState<T>(() => {
    return value ?? defaultValue ?? DEFAULT_VALUE
  })

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    if (!isControlled && prevValue !== value) {
      // eslint-disable-next-line react/set-state-in-effect
      setStateValue(value ?? DEFAULT_VALUE)
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [value])

  // avoid re-render when value is controlled
  const mergedValue = isControlled ? value : stateValue

  const handleChange = (v: React.SetStateAction<Nullable<T>>) => {
    const _v = (isFunction(v) ? v(stateValue) : v)
    if (!isControlled) {
      setStateValue(_v ?? DEFAULT_VALUE)
    }

    onChange?.(_v)
  }

  return [mergedValue, handleChange]
}
