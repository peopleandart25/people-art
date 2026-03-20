'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

/**
 * [Range Slider 컴포넌트 - @radix-ui/react-slider 기반]
 * 
 * 주요 특징:
 * - 양방향 범위(Range) 슬라이더 지원
 * - Track 어디든 클릭하면 가장 가까운 Thumb이 즉시 이동 (Radix 기본 동작)
 * - 부드러운 드래그 동작 (CSS transition 없이 즉각 반응)
 * - 선택 범위는 주황색, 비활성 구간은 연한 회색
 * - Thumb: 깔끔한 원형, 호버 시 그림자로 시각적 피드백
 */

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Track: 연한 회색 배경, 클릭 시 가장 가까운 Thumb 이동 */}
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-gray-200 relative grow overflow-hidden rounded-full cursor-pointer h-2 w-full"
      >
        {/* Range: 선택된 범위 (주황색) */}
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-orange-500 absolute h-full"
        />
      </SliderPrimitive.Track>
      
      {/* Thumbs: 깔끔한 원형, 호버 시 그림자 확대 */}
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-5 rounded-full border-2 border-orange-500 bg-white shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
