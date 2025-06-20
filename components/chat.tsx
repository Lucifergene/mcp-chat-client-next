"use client";

import { useState, useEffect } from "react";
import { ArrowUpIcon, Settings, Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import { ProviderStatus } from "@/components/provider-status";

type Message = {
  role: "user" | "assistant";
  content: string | object;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  toolResponses?: any[];
};

type Server = {
  name: string;
  displayName: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableServers, setAvailableServers] = useState<Server[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [serversLoading, setServersLoading] = useState(true);

  // Load available servers on component mount
  useEffect(() => {
    const loadServers = async () => {
      try {
        console.log("Loading servers...");
        setServersLoading(true);
        const response = await fetch("/api/servers");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server data:", data);

        if (data.servers && Array.isArray(data.servers)) {
          setAvailableServers(data.servers);
          // Initialize with all servers selected
          setSelectedOptions(data.servers.map((server: Server) => server.name));
          console.log("Servers loaded:", data.servers);
        } else {
          console.error("No servers array found in response:", data);
        }
      } catch (error) {
        console.error("Failed to load servers:", error);
      } finally {
        setServersLoading(false);
      }
    };

    loadServers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Add a temp loading msg for AI
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Hang on..." },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          enabledTools: selectedOptions,
        }),
      });

      const data = await res.json();
      const content =
        typeof data?.content === "string"
          ? data.content
          : "Sorry... got no response from the server";

      const toolResponses = Array.isArray(data?.toolResponses)
        ? data.toolResponses
        : [];

      setMessages((prev) => [
        ...prev.slice(0, -1), // remove the loading message
        { role: "assistant", content, toolResponses },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Oops! Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedOptions((prevSelectedOptions) => {
      const newSelectedOptions = checked
        ? [...prevSelectedOptions, value]
        : prevSelectedOptions.filter((option) => option !== value);
      console.log("Selected options:", newSelectedOptions);
      return newSelectedOptions;
    });
  };

  const handleClearChat = () => {
    if (messages.length > 0) {
      setMessages([]);
      console.log("Chat cleared");
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">ChatBot</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleClearChat}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  disabled={messages.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New chat
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-600">with MCP Support</p>
        </div>

        {/* Provider Status */}
        <div className="p-4 border-b border-gray-200">
          <ProviderStatus />
        </div>

        {/* MCP Servers Configuration */}
        <div className="p-4 flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                MCP Servers
              </span>
            </div>

            <div className="space-y-2">
              {serversLoading ? (
                <div className="text-sm text-gray-500">Loading servers...</div>
              ) : availableServers.length > 0 ? (
                availableServers.map((server) => (
                  <label
                    key={server.name}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-400"
                      value={server.name}
                      onChange={handleCheckboxChange}
                      checked={selectedOptions.includes(server.name)}
                    />
                    <span className="text-sm text-gray-800">
                      {server.displayName}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  No servers available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Tools Display */}
        {selectedOptions.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Active Tools</div>
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => {
                const server = availableServers.find((s) => s.name === option);
                return (
                  <span
                    key={option}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800"
                  >
                    {server?.displayName || option}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages?.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-gray-800 rounded-sm"></div>
                  </div>
                  <h2 className="text-2xl font-medium text-gray-900 mb-2">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600">
                    Start a conversation with our AI assistant powered by MCP
                    tools
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8">
              <div className="space-y-8">
                {messages?.map((message, index) => (
                  <div key={index} className="group">
                    {/* Tool Responses */}
                    {message.role === "assistant" &&
                      Array.isArray(message.toolResponses) &&
                      message.toolResponses?.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                            <Wrench className="h-4 w-4" />
                            <span>
                              Used {message.toolResponses.length} tool
                              {message.toolResponses.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <Accordion type="multiple" className="w-full">
                            {message.toolResponses?.map((toolRes, i) => (
                              <AccordionItem
                                key={i}
                                value={`item-${i}`}
                                className="border border-gray-200 rounded-lg mb-2"
                              >
                                <AccordionTrigger className="px-4 py-3 text-sm text-gray-700 hover:no-underline hover:bg-gray-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    {toolRes?.name || `Tool Call #${i + 1}`}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-3">
                                  <pre className="text-xs bg-gray-50 p-3 rounded border text-gray-700 overflow-x-auto">
                                    {JSON.stringify(toolRes, null, 2)}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}

                    {/* Message */}
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                          {message.role === "user" ? (
                            <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded border-2 border-gray-400 flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {message.role === "user" ? "You" : "Assistant"}
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-800">
                          {typeof message.content === "string" ? (
                            message.role === "assistant" ? (
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-3 last:mb-0">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="mb-3 pl-4 list-disc">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="mb-3 pl-4 list-decimal">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="mb-1">{children}</li>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3">
                                      {children}
                                    </pre>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <p>{message.content}</p>
                            )
                          ) : (
                            <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                              {JSON.stringify(message.content, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-end bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 focus-within:shadow-sm">
                <AutoResizeTextarea
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInput(e)}
                  value={input}
                  placeholder="Message Assistant..."
                  className="flex-1 bg-transparent border-none resize-none px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:outline-none min-h-[24px] max-h-[200px]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:bg-gray-300"
                  disabled={!input.trim() || loading}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </Button>
              </div>

              {input.trim() && (
                <div className="text-xs text-gray-500 mt-2 px-1">
                  Press Enter to send, Shift + Enter for new line
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
