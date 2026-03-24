import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle, // 1. Import ito
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./sidebar-content";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        {/* 2. Idagdag ang Title na naka-hidden sa mata pero visible sa screen readers */}
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

        <SidebarContent onSelect={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
