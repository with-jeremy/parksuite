"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash, Upload, Check } from "lucide-react"

type ParkingSpotImage = {
  id: string
  image_url: string
  is_primary: boolean
}

export function ImageUploader({ parkingSpotId }: { parkingSpotId: string }) {
  const [images, setImages] = useState<ParkingSpotImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchImages() {
      try {
        const { data, error } = await supabase
          .from("parking_spot_images")
          .select("*")
          .eq("parking_spot_id", parkingSpotId)
          .order("is_primary", { ascending: false })

        if (error) throw error

        setImages(data || [])
      } catch (err: any) {
        console.error("Error fetching images:", err)
        setError(err.message)
      }
    }

    fetchImages()
  }, [parkingSpotId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    try {
      setUploading(true)
      setError(null)
      setSuccess(false)

      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${parkingSpotId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `parking_spots/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath)

      // Determine if this is the first image (make it primary)
      const isPrimary = images.length === 0

      // Save image reference to database
      const { data, error } = await supabase
        .from("parking_spot_images")
        .insert({
          parking_spot_id: parkingSpotId,
          image_url: publicUrl,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setImages((prev) => [...prev, data])
      setSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error uploading image:", err)
      setError(err.message)
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      setError(null)

      // Delete from database
      const { error } = await supabase.from("parking_spot_images").delete().eq("id", imageId)

      if (error) throw error

      // Try to delete from storage (this might fail if URL format doesn't match)
      try {
        // Extract file path from URL
        const urlParts = imageUrl.split("/")
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `parking_spots/${fileName}`

        await supabase.storage.from("images").remove([filePath])
      } catch (storageErr) {
        console.warn("Could not delete file from storage:", storageErr)
        // Continue anyway since the database record is deleted
      }

      // Update local state
      setImages((prev) => prev.filter((img) => img.id !== imageId))

      // If we deleted the primary image, make the first remaining image primary
      const deletedPrimary = images.find((img) => img.id === imageId)?.is_primary
      if (deletedPrimary && images.length > 1) {
        const newPrimaryId = images.find((img) => img.id !== imageId)?.id
        if (newPrimaryId) {
          await supabase.from("parking_spot_images").update({ is_primary: true }).eq("id", newPrimaryId)

          // Update local state
          setImages((prev) => prev.map((img) => (img.id === newPrimaryId ? { ...img, is_primary: true } : img)))
        }
      }
    } catch (err: any) {
      console.error("Error deleting image:", err)
      setError(err.message)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      setError(null)

      // Update all images to not primary
      await supabase.from("parking_spot_images").update({ is_primary: false }).eq("parking_spot_id", parkingSpotId)

      // Set selected image as primary
      const { error } = await supabase.from("parking_spot_images").update({ is_primary: true }).eq("id", imageId)

      if (error) throw error

      // Update local state
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        })),
      )
    } catch (err: any) {
      console.error("Error setting primary image:", err)
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
      {success && <div className="bg-green-50 p-4 rounded-md text-green-800">Image uploaded successfully!</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <Image src={image.image_url || "/placeholder.svg"} alt="Parking spot" fill className="object-cover" />
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Primary
                </div>
              )}
            </div>
            <CardContent className="p-3 flex justify-between">
              {!image.is_primary && (
                <Button variant="outline" size="sm" onClick={() => handleSetPrimary(image.id)}>
                  Set as Primary
                </Button>
              )}
              {image.is_primary && <div />}

              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => handleDeleteImage(image.id, image.image_url)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="overflow-hidden">
          <div className="aspect-square flex items-center justify-center bg-muted">
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center p-4">
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Upload Image</span>
                <span className="text-xs text-muted-foreground">Click to browse</span>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <CardContent className="p-3">
            <p className="text-xs text-center text-muted-foreground">
              {uploading ? "Uploading..." : "JPG, PNG or GIF, max 5MB"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

