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
  const [value, setValue] = useState(`
# Einführung in Python
## Was ist Python?
Python ist eine interpretierte, objektorientierte, high-level Programmiersprache mit dynamischer Semantik. Sie ist einfach zu lernen und hat eine übersichtliche Syntax, was Python zu einem idealen Werkzeug für das Scripting und schnelle Anwendungsentwicklung macht.

---

# Installation von Python
## Wie installiert man Python?
Besuchen Sie [python.org](https://python.org) und laden Sie die neueste Version für Ihr Betriebssystem herunter. Installation ist meistens durch einen einfachen Installer möglich.

\`\`\`
# Überprüfen der Python-Version
python --version
\`\`\`
---

# Erste Schritte mit Python
## Python Interpreter
Der Python Interpreter kann interaktiv verwendet werden. Hier ein einfaches Beispiel:

\`\`\`
# Python Code in der interaktiven Shell
>>> print("Hallo, Welt!")
Hallo, Welt!
\`\`\`
---

# Variablen und Datentypen
## Einführung in Variablen
In Python können Daten ohne explizite Deklaration gespeichert werden:

\`\`\`
# Beispiel für Variablen
x = 10        # Ein Integer
y = "Hallo"   # Ein String
z = 4.5       # Ein Float
\`\`\`
---

# Operatoren
## Arithmetische Operatoren
Python unterstützt verschiedene Arten von Operatoren:

\`\`\`
# Beispiele für Operatoren
a = 5
b = 2
print(a + b)  # Ergebnis: 7
print(a * b)  # Ergebnis: 10
print(a / b)  # Ergebnis: 2.5
print(a % b)  # Ergebnis: 1
\`\`\`
---

# Kontrollstrukturen
## If-Else Bedingungen
Kontrollieren Sie den Fluss Ihres Programms mit Bedingungen:

\`\`\`
# Beispiel für if-else
if a > b:
    print("a ist größer als b")
else:
  print("b ist größer oder gleich a")
\`\`\`
---

# Schleifen
## For-Schleifen und While-Schleifen
Python bietet verschiedene Schleifenkonstruktionen:

\`\`\`
# For-Schleife
for i in range(5):
    print(i)

# While-Schleife
while a > b:
    print(a)
    a -= 1
\`\`\`
---

# Funktionen
## Definition und Aufruf
Funktionen sind wiederverwendbare Codeblöcke:

\`\`\`
# Definition einer Funktion
def gruessen(name):
    print("Hallo " + name)

# Aufruf der Funktion
gruessen("Anna")
\`\`\`
---

# Listen und Tupel
## Arbeiten mit kollektiven Datentypen
Listen und Tupel sind integral für das Sammeln von Daten:

\`\`\`
# Liste
meine_liste = [1, 2, 3, 4, 5]
print(meine_liste[2])  # Zugriff auf das Element an Index 2

# Tupel
mein_tupel = (1, 2, 3)
print(mein_tupel[0])  # Zugriff auf das erste Element
\`\`\`
---

# Dictionaries
## Schlüssel-Wert Paare
Dictionaries sind wichtig für das Mapping von Schlüsseln zu Werten:

\`\`\`
# Dictionary
mein_dict = {'a': 1, 'b': 2, 'c': 3}
print(mein_dict['b'])  # Zugriff auf den Wert mit Schlüssel 'b'
\`\`\``);
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
        <h1 className="border-b px-2 py-2 text-sm font-semibold ">Create a presentation about python</h1>
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
            className={`prose max-w-[120ch] mx-auto ${
              isDarkMode
                ? "prose-headings:text-neutral-200 prose-p:text-neutral-200 prose-ul:text-neutral-200 prose-ol:text-neutral-200"
                : "text-neutral-950"
            }`}
          >
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
