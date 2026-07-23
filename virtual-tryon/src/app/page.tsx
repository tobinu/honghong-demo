"use client";

import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, Loader2, Download, RotateCcw, Sparkles } from "lucide-react";

type ClothingCategory = "top" | "bottom" | "dress" | "unknown";

interface TryOnResult {
  id: string;
  personImageUrl: string;
  garmentImageUrl: string;
  resultImageUrl: string;
  size: string;
  category: ClothingCategory;
  createdAt: string;
}

export default function HomePage() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const [garmentPreview, setGarmentPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleImageUpload = useCallback(
    (type: "person" | "garment") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("请上传图片文件");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("图片大小不能超过 10MB");
        return;
      }

      const preview = URL.createObjectURL(file);

      if (type === "person") {
        setPersonImage(file);
        setPersonPreview(preview);
      } else {
        setGarmentImage(file);
        setGarmentPreview(preview);
      }

      setError("");
      setResult(null);
    },
    []
  );

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "图片上传失败");
    }

    const data = await response.json();
    return data.url;
  };

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      setError("请上传人物照片和服装图片");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Step 1: Upload images
      console.log("[FRONTEND] Uploading images...");
      const [personImageUrl, garmentImageUrl] = await Promise.all([
        uploadImage(personImage),
        uploadImage(garmentImage),
      ]);
      console.log("[FRONTEND] Images uploaded");

      setIsUploading(false);
      setIsProcessing(true);

      // Step 2: Call try-on API
      console.log("[FRONTEND] Calling try-on API...");
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personImageUrl,
          garmentImageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "试衣处理失败");
      }

      const data = await response.json();
      console.log("[FRONTEND] Try-on complete:", data);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误，请重试");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setGarmentImage(null);
    setPersonPreview("");
    setGarmentPreview("");
    setResult(null);
    setError("");
  };

  const handleDownload = async () => {
    if (!result?.resultImageUrl) return;

    setIsDownloading(true);
    setError("");

    try {
      // 使用服务端代理下载，设置正确的 Content-Disposition 头
      const filename = `try-on-${Date.now()}.png`;
      const downloadUrl = `/api/download?url=${encodeURIComponent(result.resultImageUrl)}&filename=${encodeURIComponent(filename)}`;
      
      // 直接打开下载链接
      window.open(downloadUrl, '_blank');
    } catch {
      setError("下载失败，请重试");
    } finally {
      // 短暂延迟后关闭下载状态，让用户看到反馈
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">虚拟试衣</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/history" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              历史记录
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            看看穿在身上的效果
          </h2>
          <p className="text-gray-600">
            上传您的照片和任意服装图片，即可获得试穿预览
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Person Image Upload */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload("person")}
              className="hidden"
              id="person-upload"
              disabled={isUploading || isProcessing}
            />
            <label htmlFor="person-upload" className={`cursor-pointer block ${isUploading || isProcessing ? 'opacity-50' : ''}`}>
              {personPreview ? (
                <div className="relative">
                  <img
                    src={personPreview}
                    alt="您的照片"
                    className="w-full h-64 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 transition-opacity font-medium">
                      更换照片
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-12 h-12 mb-3" />
                  <span className="font-medium">上传您的照片</span>
                  <span className="text-sm mt-1">支持 JPG、PNG，最大 10MB</span>
                </div>
              )}
            </label>
            <p className="text-center text-sm text-gray-500 mt-2">人物照片</p>
          </div>

          {/* Garment Image Upload */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 hover:border-purple-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload("garment")}
              className="hidden"
              id="garment-upload"
              disabled={isUploading || isProcessing}
            />
            <label htmlFor="garment-upload" className={`cursor-pointer block ${isUploading || isProcessing ? 'opacity-50' : ''}`}>
              {garmentPreview ? (
                <div className="relative">
                  <img
                    src={garmentPreview}
                    alt="服装图片"
                    className="w-full h-64 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 transition-opacity font-medium">
                      更换服装
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-3" />
                  <span className="font-medium">上传服装图片</span>
                  <span className="text-sm mt-1">上装、下装或连衣裙</span>
                </div>
              )}
            </label>
            <p className="text-center text-sm text-gray-500 mt-2">服装图片</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleTryOn}
            disabled={!personImage || !garmentImage || isUploading || isProcessing}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                上传中...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始试衣
              </>
            )}
          </button>

          {(personPreview || garmentPreview) && (
            <button
              onClick={handleReset}
              disabled={isUploading || isProcessing}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              重置
            </button>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-xl border p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-900">试衣结果</h3>
            <div className="flex justify-center">
              <img
                src={result.resultImageUrl}
                alt="试衣结果"
                className="max-h-[500px] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    下载结果
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">简单上传</h3>
            <p className="text-sm text-gray-600">
              无需特殊姿势或背景要求
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Loader2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">快速处理</h3>
            <p className="text-sm text-gray-600">
              10-20 秒即可获得预览
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">参考质量</h3>
            <p className="text-sm text-gray-600">
              仅供购买参考，非精确尺码
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}