"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import InputWithButton from "../components/ui/InputWithButton";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Word {
  word: string;
  desc: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  let [activeWord, setActiveWord] = useState("");
  let [loading, setLoading] = useState(false);
  let [words, setWords] = useState<Word[]>([]);
  let [aiResponse, setAiResponse] = useState("");

  const handleDeleteWord = async (word: any) => {
    try {
      await fetch(`/api/word`, {
        method: "DELETE",
        body: JSON.stringify({ id: word._id }),
      });
      setWords((words = words.filter((item) => item.word !== word.word)));
    } catch (error) {
      toast({
        title: "警告",
        description: "删除失败",
        action: <ToastAction altText="Try again">知道了</ToastAction>,
      });
    }
  };

  const handleSaveWord = async ({
    word,
    desc,
  }: {
    word: string;
    desc: string;
  }) => {
    try {
      await fetch("/api/word", {
        method: "POST",
        body: JSON.stringify({ word, desc }),
      });
    } catch (error) {
      toast({
        title: "警告",
        description: "保存失败",
        action: <ToastAction altText="Try again">知道了</ToastAction>,
      });
    }
  };

  const handleSubmit = async (inputStr: string) => {
    if (!inputStr) {
      toast({
        title: "提示",
        description: "请填写单词",
        action: <ToastAction altText="Try again">知道了</ToastAction>,
      });
      return;
    }
    setActiveWord((activeWord = inputStr.trim()));
    setAiResponse((aiResponse = ""));
    setLoading((loading = true));

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        body: JSON.stringify({ word: inputStr }),
      });
      const reader = res.body!.getReader();
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("stream completed");
            break;
          }
          let chunk = new TextDecoder("utf-8").decode(value);
          setAiResponse((aiResponse += chunk));
        }
      };
      await processStream();
      await handleSaveWord({ word: inputStr, desc: aiResponse });
      await handleQueryAllWord();
    } catch (error) {
    } finally {
      setLoading((loading = false));
    }
  };

  const handleQueryAllWord = async () => {
    const res = await fetch("/api/word/all", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setWords((words = [...(await res.json())]));
  };

  const handleShowWord = (word: Word) => {
    setActiveWord((activeWord = word.word));
    setAiResponse((aiResponse = word.desc));
  };

  useEffect(() => {
    handleQueryAllWord();
  }, []);
  return (
    <>
      <div className="h-full">
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="h-6 w-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-4 shrink-0 items-center"></div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {words.map((item) => (
                          <li key={item.word}>
                            <a
                              onClick={() => {
                                setSidebarOpen(false);
                                handleShowWord(item);
                              }}
                              className={classNames(
                                activeWord == item.word
                                  ? "bg-gray-50 text-indigo-600"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                              )}
                            >
                              {item.word}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
            <div className="flex h-4 shrink-0 items-center"></div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {words.map((item) => (
                      <li key={item.word}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <a
                              onClick={() => handleShowWord(item)}
                              className={classNames(
                                activeWord == item.word
                                  ? "bg-gray-50 text-indigo-600"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                              )}
                            >
                              {item.word}
                            </a>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => handleDeleteWord(item)}
                            >
                              删除
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            {activeWord}
          </div>
          <a href="#">
            <span className="sr-only">Your profile</span>
          </a>
        </div>

        <main className="py-10 lg:pl-72 h-full">
          <div className="px-4 sm:px-6 lg:px-8 h-full">
            <main className="h-full">
              <div className="container h-full flex flex-col items-center ">
                <div className="w-full mt-0 flex justify-center ">
                  <InputWithButton
                    inputPlaceholder={"请输入英语单词"}
                    buttonText={"开始分析"}
                    loading={loading}
                    onClick={handleSubmit}
                  ></InputWithButton>
                </div>
                <pre className="mt-12 text-wrap">{aiResponse}</pre>
              </div>
            </main>
          </div>
        </main>
      </div>
    </>
  );
}
