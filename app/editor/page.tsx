"use client";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Edit2Icon,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  MousePointerClickIcon,
  SaveIcon,
  SunIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import LaserPointer from "@/components/LaserPointer";
import { decompressFromEncodedURIComponent } from "lz-string";
import { motion, AnimatePresence } from "framer-motion";

export default function Editor({
  searchParams,
}: {
  searchParams: { content: string };
}) {
  const [value, setValue] = useState(
    searchParams.id != null
      ? JSON.parse(localStorage.getItem("slides")).filter(
          (item) => item.id === searchParams.id
        )[0].content
      : ""
  );

  const [title, setTitle] = useState(
    searchParams.id != null
      ? JSON.parse(localStorage.getItem("slides")).filter(
          (item) => item.id === searchParams.id
        )[0].title
      : ""
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scaleLevel, setScaleLevel] = useState<Number>(1);
  const [presenting, setPresenting] = useState(false);
  const [laserPointer, setLaserPointer] = useState(false);
  const [isDarkMode, setDarkMode] = useState(true);
  const slides = value
    .toString()
    .split("---")
    .map((slide: string) => slide.trim());

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
          setScaleLevel(2);
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            setScaleLevel(1);
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
        <div className="border-b px-2 py-2 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>{title}</div>
            <div>
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => {
                  const title = prompt("Title");
                  setTitle(title);
                }}
              >
                <Edit2Icon size={18} />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className={`${
                isDarkMode
                  ? "hover:bg-neutral-900"
                  : "hover:bg-neutral-200 hover:text-neutral-950"
              }`}
              variant={"default"}
              size={"sm"}
              onClick={() => {
                const title = prompt("Title");
                setTitle(title);
              }}
            >
              Save
              <SaveIcon size={18} />
            </Button>
            <Button
              className={`${
                isDarkMode
                  ? "hover:bg-neutral-900"
                  : "hover:bg-neutral-200 hover:text-neutral-950"
              }`}
              variant={"ghost"}
              size={"sm"}
              onClick={() => {
                const title = prompt("Title");
                setTitle(title);
              }}
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>
      )}
      <div className="flex grow">
        {!presenting && (
          <Textarea
            className="max-w-[120ch] border-l-0 border-t-0 border-b-0 border-r w-1/2 resize-none focus-visible:ring-0 rounded-none m-1"
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
          <div
            className={`w-full h-full overflow-hidden overscroll-none ${
              isDarkMode
                ? "prose-headings:text-neutral-200 prose-p:text-neutral-200 prose-ul:text-neutral-200 prose-ol:text-neutral-200 prose-strong:text-neutral-200 prose-code:text-neutral-200"
                : "text-neutral-950"
            }`}
          >
            {presenting ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  className="border-l-2 h-full p-20 max-w-full prose"
                  key={slides[currentSlide]}
                  initial={{ x: "-100vw", opacity: 1 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100vw', opacity: 1 }}
                  transition={{ duration: 1 }}
                >
                  <MarkdownRenderer
                    markdown={slides[currentSlide]}
                    style={{ fontSize: `${scaleLevel}rem` }}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="prose p-10">
                <MarkdownRenderer markdown={slides[currentSlide]} />
              </div>
            )}
          </div>
          <div
            className={`absolute bottom-0 left-0 right-0 flex text-xs justify-between ${
              isDarkMode
                ? "bg-neutral-950 text-neutral-100"
                : "bg-neutral-100 text-neutral-950"
            } z-20 ${presenting ? "opacity-50 hover:opacity-100" : ""}`}
          >
            <div className="flex items-center gap-2">
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => {
                  setPresenting(!presenting);
                  setLaserPointer(false);
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
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => setLaserPointer(!laserPointer)}
              >
                <MousePointerClickIcon size={18} />
              </Button>
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => setDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
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
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => changeActiveSlide({ direction: "next" })}
              >
                <ArrowRightIcon size={18} />
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => setScaleLevel((prev) => Number(prev) - 0.1)}
              >
                <ZoomOutIcon size={16} />
              </Button>
              <div>{Math.round(Number(scaleLevel.toFixed(1)) * 100)}%</div>
              <Button
                className={`${
                  isDarkMode
                    ? "hover:bg-neutral-900"
                    : "hover:bg-neutral-200 hover:text-neutral-950"
                }`}
                variant={"ghost"}
                size={"sm"}
                onClick={() => setScaleLevel((prev) => Number(prev) + 0.1)}
              >
                <ZoomInIcon size={16} />
              </Button>
            </div>
          </div>
          {laserPointer && <LaserPointer />}
        </div>
      </div>
    </main>
  );
}
