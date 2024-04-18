"use client";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  MousePointerClickIcon,
  SunIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import LaserPointer from "@/components/LaserPointer";

export default function Home() {
  const [value, setValue] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scaleLevel, setScaleLevel] = useState<Number>(1);
  const [presenting, setPresenting] = useState(false);
  const [laserPointer, setLaserPointer] = useState(false);
  const [isDarkMode, setDarkMode] = useState(true);
  const slides = value
    .toString()
    .split("---")
    .map((slide) => slide.trim());

  const changeActiveSlide = ({ direction }: { direction: "prev" | "next" }) => {
    if (direction === "prev") {
      setCurrentSlide((prevSlide) =>
        prevSlide === 0 ? slides.length - 1 : prevSlide - 1
      );
    } else {
      setCurrentSlide((prevSlide) =>
        prevSlide === slides.length - 1 ? 0 : prevSlide + 1
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presenting && !(e.ctrlKey && e.key === "Enter")) return;

      if (e.key === "ArrowLeft") {
        changeActiveSlide({ direction: "prev" });
      } else if (e.key === "ArrowRight") {
        changeActiveSlide({ direction: "next" });
      } else if (e.key === "Escape") {
        if (document.exitFullscreen) {
          setPresenting(false);

          document.exitFullscreen();
          setScaleLevel(1);
        }
      } else if (e.ctrlKey && e.key === "Enter") {
        setPresenting(!presenting);
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [presenting]);

  return (
    <main className="flex flex-col h-svh relative">
      {!presenting && (
        <h1 className="border-b px-1 py-2">Create a presentation</h1>
      )}
      <div className="flex grow">
        {!presenting && (
          <Textarea
            className="border-l-0 border-t-0 border-b-0 border-r w-1/2 resize-none focus-visible:ring-0 rounded-none m-1"
            onChange={(e) => {
              setValue(e.target.value);
            }}
            value={value}
          />
        )}
        <div
          className={`grow relative ${laserPointer ? "cursor-none" : ""} ${
            isDarkMode
              ? "bg-neutral-950 text-neutral-100"
              : "text-neutral-950 bg-neutral-100"
          }`}
        >
          <div className={`prose max-w-[120ch] mx-auto `}>
            {slides.length > 0 ? (
              <MarkdownRenderer
                style={{ fontSize: `${scaleLevel}rem`, padding: "3rem" }}
                isDarkMode={isDarkMode}
              >
                {slides[currentSlide]}
              </MarkdownRenderer>
            ) : (
              <p>Start typing to create slides...</p>
            )}
          </div>
          <div
            className={`absolute bottom-0 left-0 right-0 flex text-xs justify-between bg-background z-20 ${
              presenting ? "opacity-50 hover:opacity-100" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => {
                  setPresenting(!presenting);
                  setScaleLevel(2);
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    if (document.exitFullscreen) {
                      document.exitFullscreen();
                      setScaleLevel(1);
                    }
                  }
                }}
              >
                {presenting ? (
                  <MinimizeIcon size={18} />
                ) : (
                  <MaximizeIcon size={18} />
                )}
              </Button>
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => setLaserPointer(!laserPointer)}
              >
                <MousePointerClickIcon size={18} />
              </Button>
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => setDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => changeActiveSlide({ direction: "prev" })}
              >
                <ArrowLeftIcon size={18} />
              </Button>
              <div>
                {currentSlide + 1}/{slides.length}
              </div>
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => changeActiveSlide({ direction: "next" })}
              >
                <ArrowRightIcon size={18} />
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => setScaleLevel((prev) => prev - 0.1)}
              >
                <ZoomOutIcon size={16} />
              </Button>
              <div>{Math.round(scaleLevel.toFixed(1) * 100)}%</div>
              <Button
                variant={"ghost"}
                size={"sm"}
                onClick={() => setScaleLevel((prev) => prev + 0.1)}
              >
                <ZoomInIcon size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {laserPointer && <LaserPointer />}
    </main>
  );
}
