"use client"
import React, { useEffect, useTransition } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { aspectRatioOptions, creditFee, transformationTypes } from '@/constants'
import { Input } from "@/components/ui/input"
import { title } from 'process'
import { defaultValues } from '@/constants'
import { CustomField } from './CustomField'
import { AspectRatioKey, debounce, deepMergeObjects } from '@/lib/utils'
import { updateCredits } from '@/lib/actions/user.actions'
import MediaUploader from './MediaUploader'
import TransformImage from './TransformImage'
import { getCldImageUrl } from 'next-cloudinary'
import { addImage, updateImage } from '@/lib/actions/image.actions'
import { useRouter } from 'next/navigation'
import { set } from 'mongoose'
import { InsufficientCreditsModal } from './InsufficientCreditsModal'

export const formSchema = z.object({
    title: z.string(),
    aspectRatio: z.string().optional(),
    color: z.string(),
    prompt: z.string(),
    publicId: z.string()
})


const TransformationForm = ({action, data = null, userId, type, creditBalance, config = null} : TransformationFormProps) => {
    const transformationType = transformationTypes[type]
    
    const [image, setImage] = useState(data);
    const [newTransformation, setNewTransformation] = useState<Transformations | null>(null);
    const [isSubmmiting, setIsSubmmiting] = useState(false);
    const [isTransforming, setIsTransforming] = useState(false);
    const [transformationConfig, setTransformationConfig] = useState(config);
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const initialValues = data && action === 'Update' ? {
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,
    } : defaultValues
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues
    })

    console.log(action)

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
        console.log("jjjjjj")
        setIsSubmmiting(true)
        if (data || image) {
            const transformationUrl = getCldImageUrl({
                width: image?.width,
                height: image?.height,
                src: image?.publicId,
                ...transformationConfig
            })

            const imageData = {
                title: values.title,
                publicId: image?.publicId,
                transformationType: type,
                width: image?.width,
                height: image?.height,
                config: transformationConfig,
                secureURL: image?.secureURL,
                transformationURL: transformationUrl,
                aspectRatio: image?.aspectRatio,
                prompt: values.prompt,
                color: values.color
            }
            console.log(imageData)
            if (action === 'Add') {
                try {
                    const newImage = await addImage({
                        image: imageData,
                        userId,
                        path: '/'
                    })
                    console.log(newImage)

                    if(newImage) {
                        form.reset()
                        setImage(data)
                        router.push(`/transformations/${newImage._id}`)
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            
            if (action === 'Update') {
                // Update the image
                try {
                    const updatedImage = await updateImage({
                        image: {
                            ...imageData,
                            _id: data?._id
                        },
                        userId,
                        path: `/transformations/${data._id}`
                    })

                    if(updatedImage) {
                        router.push(`/transformations/${updatedImage._id}`)
                    }
                } catch (error) {
                    console.log(error)
                }
            }

        }

        setIsSubmmiting(false)
    }

    const onSelectFieldHandler = (value: string, onChangeField: (value:string)=> void) => {
        const imageSize = aspectRatioOptions[value as AspectRatioKey]
        setImage((prevState: any)=> ({
            ...prevState,
            aspectRatio: imageSize.aspectRatio,
            width: imageSize.width,
            height: imageSize.height
        }))

        setNewTransformation(transformationType.config)

        return onChangeField(value)
    }

    const onInputChangeHandler = (fieldName:string, value:string, type:string, onChangeField: (value:string)=> void) => {
        debounce(()=>{
            setNewTransformation((prevState: any) => ({
                ...prevState,
                [type]: {
                    ...prevState?.[type],
                    [fieldName === 'prompt' ? 'prompt' : 'to']:value
                }
            }))
        },1000)()
        return onChangeField(value)
    }

    const onTransformHandler = async() => {
        setIsTransforming(true)

        console.log('newTransformation', newTransformation)
        console.log('transformationConfig', transformationConfig)
        console.log(deepMergeObjects(newTransformation, transformationConfig))
        setTransformationConfig(
            deepMergeObjects(newTransformation, transformationConfig)
        )
        setNewTransformation(null)

        startTransition(async() => {
            await updateCredits(userId, creditFee)
        })
    }

    useEffect(() => {
        if(image && (type === 'restore' || type === 'removeBackground')) {
            setNewTransformation(transformationType.config)
        }
    },[image, transformationType.config, type])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}
        <CustomField 
            control={form.control}
            name='title'
            formLabel='Image Title'
            className='w-full'
            render={({field}) => (
                <Input {...field} className='input-field'/>
            )}
        />
        {type === 'fill' && (
            <CustomField
                control={form.control}
                name='aspectRatio'
                formLabel='Aspect Ratio'
                className='w-full'
                render={({field}) => (
                    <Select
                        onValueChange={(value) => onSelectFieldHandler(value, field.onChange)}
                        value={field.value}
                    >
                        <SelectTrigger className="select-field">
                            <SelectValue placeholder="Select Size" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(aspectRatioOptions).map((key) => (
                                <SelectItem key={key} value={key} className='select-item'>
                                    {aspectRatioOptions[key as AspectRatioKey].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

        )}

        {(type === 'remove' || type === 'recolor') && (
            <div className='prompt-field'>
                <CustomField 
                    control = {form.control}
                    name='prompt'
                    formLabel={
                        type === 'remove' ? 'Onject to remove' : 'Object to recolor'
                    }
                    className='w-full'
                    render={({field}) => (
                        <Input 
                            value={field.value} 
                            className='input-field'
                            onChange={(e) => onInputChangeHandler(
                                'prompt',
                                e.target.value,
                                type,
                                field.onChange
                            )}
                        />
                    )}
                />

                {type === 'recolor' && (
                    <CustomField 
                        control={form.control}
                        name='color'
                        formLabel='Replacement Color'
                        className='w-full'
                        render={({field}) => (
                            <Input 
                                value={field.value} 
                                className='input-field'
                                onChange={(e) => onInputChangeHandler(
                                'color',
                                e.target.value,
                                'recolor',
                                field.onChange
                            )}
                            />
                        )}
                    />
                )}
            </div>
        )}

        
        <div className='media-uploader-field'>
            <CustomField 
                control={form.control}
                name='publicId'
                className='flex size-full flex-col'
                render={({field}) => (
                    <MediaUploader 
                        onValueChange={field.onChange}
                        setImage={setImage}
                        publicId={field.value}
                        image={image}
                        type={type}
                    />
                )}
            />

            <TransformImage 
                image={image}
                type={type}
                title={form.getValues('title')}
                isTransforming={isTransforming}
                setIsTransforming={setIsTransforming}
                transformationConfig={transformationConfig}
            />
        </div>

        <div className='flex flex-col gap-4'>

        <Button 
            type='button' 
            className='submit-button capitalize'
            disabled={isTransforming || newTransformation === null}
            onClick={onTransformHandler}
        >
            {isTransforming ?  "Transforming ...": "Apply transformation"}
        </Button>

        <Button 
            type='submit' 
            className='submit-button capitalize'
            disabled={isSubmmiting}
        >
            {isSubmmiting ? 'Submmitng ...' : 'Save Image'}
        </Button>
        </div>
      </form>
    </Form>
  )
}

export default TransformationForm