"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import Link from 'next/link'
import { Button } from './ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import google from '../public/google.svg'
const formSchema = z.object({
    username: z.string().min(1, { message: "Username  is required" }),
    password: z.string().min(1, { message: "password is required" })
})

const defaultValues = {
    username: "",
    password: ""
}

const SignIn = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues
    })
    const router = useRouter()
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log(values.username)
        const res = await signIn('credentials', {
            username: values.username,
            password: values.password,
            redirect: false,
        });
        if (!res?.error) {
            router.push('/');

        }
    }
    const handleGoogle = async () => {
        const res = await signIn('google', {
            callbackUrl: '/',
            redirect: false
        });
        // if (!res?.error) {
        //     router.push('/');
        // }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* <header className="bg-background border-b px-4 md:px-6 flex items-center justify-between h-14">
                <Link href="#" className="flex items-center gap-2" prefetch={false}>

                    <span className="sr-only">Acme Inc</span>
                </Link>
                <Link
                    href="#"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                >
                    Sign Up
                </Link>
            </header> */}
            <main className="flex-1 flex items-center bg-slate-400 justify-center">
                <Card className="w-full max-w-md p-4">
                    <CardHeader>
                        <CardTitle>Signin to your Account</CardTitle>
                    </CardHeader>
                    <Form {...form}>
                        {/* <form onSubmit={form.handleSubmit(onSubmit)} className=' flex justify-center items-center flex-col gap-2 w-full' >
                            <FormField
                                control={form.control}
                                name="username"

                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="enter your Username " {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your password " {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className='w-full'>Submit</Button>
                           
                        </form> */}
                        <Button onClick={handleGoogle} className='w-full h-max flex gap-2 text-white text-4xl hover:bg-white'><Image src={google} className='h-24 w-24' alt='k'/>Google</Button>

                    </Form>
                </Card>
            </main>
        </div>
    )
}

export default SignIn;
