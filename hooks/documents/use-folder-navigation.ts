"use client"

import { useState, useCallback } from "react"

type DriveType = "personal" | "google" | "onedrive" | null

interface FolderNavigationState {
  activeDrive: DriveType
  currentFolder: string
  breadcrumb: Array<{ name: string; path: string }>
}

export function useFolderNavigation() {
  const [state, setState] = useState<FolderNavigationState>({
    activeDrive: null,
    currentFolder: "/",
    breadcrumb: []
  })

  const selectDrive = useCallback((drive: DriveType) => {
    setState(prev => ({
      ...prev,
      activeDrive: drive,
      currentFolder: "/",
      breadcrumb: []
    }))
  }, [])

  const selectFolder = useCallback((folderPath: string) => {
    setState(prev => ({
      ...prev,
      currentFolder: folderPath,
      breadcrumb: [
        { name: "Disques", path: "" },
        { name: "Personnel", path: "/" },
        { name: folderPath, path: folderPath }
      ]
    }))
  }, [])

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentFolder !== "/") {
        return {
          ...prev,
          currentFolder: "/",
          breadcrumb: [
            { name: "Disques", path: "" },
            { name: "Personnel", path: "/" }
          ]
        }
      } else {
        return {
          ...prev,
          activeDrive: null,
          currentFolder: "/",
          breadcrumb: []
        }
      }
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      activeDrive: null,
      currentFolder: "/",
      breadcrumb: []
    })
  }, [])

  return {
    activeDrive: state.activeDrive,
    currentFolder: state.currentFolder,
    breadcrumb: state.breadcrumb,
    selectDrive,
    selectFolder,
    goBack,
    reset
  }
}
