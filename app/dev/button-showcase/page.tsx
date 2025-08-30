"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

export default function ButtonShowcasePage() {
  return (
    <div className="min-h-screen p-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold">Button showcase</h1>

        <section className="space-y-4">
          <h2 className="font-medium">Default / Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-medium">Sizes</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>

            <div className="flex items-center gap-4">
              <Button size="big">Big</Button>
              <Button size="big" fullWidth icon={<Icons.google />}>
                Big full width
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-medium">Icon placements</h2>
          <div className="flex flex-wrap gap-4">
            <Button icon={<Icons.google />}>Left icon (default)</Button>
            <Button icon={<Icons.google />} iconPosition="right">
              Right icon
            </Button>
            <Button icon={<Icons.spinner />} ariaLabel="Loading" />
            <Button disabled icon={<Icons.google />} ariaLabel="Disabled" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-medium">States</h2>
          <div className="flex gap-4 items-center">
            <Button disabled>Disabled</Button>
            <Button variant="default" className="opacity-80">Subtle</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
