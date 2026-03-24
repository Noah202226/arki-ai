"use client";

import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./sidebar-content";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Ito ang function na ipapasa natin sa SidebarContent
  const handleItemSelect = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* Siniguro nating sa mobile (md:hidden) lang ito lalabas */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0 border-r-0">
        {/* Para sa Accessibility/SEO */}
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

        {/* Dahil sa SidebarContent na ginawa natin kanina:
           1. Kapag nag-click ng Link -> onSelect() -> Sheet Closes.
           2. Kapag nag-click ng Logout -> onSelect() -> Sheet Closes -> Clerk SignOut.
        */}
        <SidebarContent onSelect={handleItemSelect} />
      </SheetContent>
    </Sheet>
  );
}
