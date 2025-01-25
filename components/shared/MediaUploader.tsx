"use client"
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { CldImage, CldUploadWidget } from 'next-cloudinary'
import Image from 'next/image'
import { dataUrl, getImageSize } from '@/lib/utils'
import { PlaceholderValue } from 'next/dist/shared/lib/get-img-props'

type MediaUploaderProps = {
    onValueChange: (value: string) => void
    setImage: (value: any) => void
    image: string
    publicId: string
    type: string
}
const MediaUploader = ({onValueChange, setImage, image, publicId, type}: MediaUploaderProps) => {

    const {toast} = useToast()
    const onUploadSuccesHandler = (results: any) => {
        setImage((prevState: any)=>({
            ...prevState,
            publicId: results?.info?.public_id,
            width: results?.info?.width,
            height: results?.info?.height,
            secureUrl: results?.info?.secure_url
        }))

        onValueChange(results?.info?.public_id)

        toast({
            title: 'Image uploaded successfully',
            description: '1 credit has been deducted from your account',
            duration: 5000,
            className: 'success-toast'
        })
    }
    const onUploadErrorHandler = (error: any) => {
        toast({
            title: 'Something went wrong',
            description: 'Please try again',
            duration: 5000,
            className: 'error-toast'
        })
    }

  return (
    <CldUploadWidget
        uploadPreset='imagenary'
        options={{
            multiple: false,
            resourceType: 'image',
        }}
        onSuccess={onUploadSuccesHandler}
        onError={onUploadErrorHandler}

    >
        {({open}) => (
            <div className='flex flex-col gap-4'>
                <h3 className='h3-bold text-dark-600'>Original</h3>
                {publicId ? (
                    <>
                        <div className='cursor-pointer overflow-hidden rounded-[10px]'>
                            <CldImage 
                                width={getImageSize(type, image, "width")}
                                height={getImageSize(type, image, "height")}
                                src={publicId}
                                alt='image'
                                sizes={"(max-width: 767px) 100vw,  50vw"}
                                placeholder={dataUrl as PlaceholderValue}
                                className='media-uploader_cldImage'
                            />
                        </div>
                    </>
                ):(
                    <>
                        <div className='media-uploader_cta' onClick={()=> open()}>
                            <div className='media-uploader_cta-image'>
                                <Image src="/assets/icons/add.svg" width={34} height={34} alt='add' />
                            </div>
                            <p className='p-14-medium'>Click here to upload image</p>
                        </div>
                    </>
                )}
            </div>
        )}

    </CldUploadWidget>
  )
}

export default MediaUploader