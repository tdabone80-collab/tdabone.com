 'use client'
import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'


export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center py-24">
      <SignIn.Root>
        <Clerk.Loading>
          {(isGlobalLoading) => (
            <SignIn.Step name="start">
          <Card className="w-full max-w-sm md:max-w-lg rounded-2xl ">
                <div className="flex flex-col items-center p-6 md:p-10 gap-8 md:gap-12">
                  {/* Event logo box */}
            <div className="w-40 md:w-72 h-28 md:h-44 bg-white border border-gray-300 rounded-2xl flex items-center justify-center">
                    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="120" height="80" rx="16" fill="#FFFFFF" />
                      <rect x="8" y="8" width="104" height="64" rx="12" fill="#F3F4F6" />
                    </svg>
                  </div>

                  {/* Inner content frame (matches 527px width from Figma, responsive) */}
            <div className="w-full max-w-sm md:max-w-md flex flex-col items-center gap-3 md:gap-5">
                    <div className="w-full flex flex-col items-center gap-2 md:gap-3">
              <h1 className="text-2xl md:text-2xl lg:text-3xl font-medium md:leading-9 text-black text-center">
                        Selamat datang di <br /> <span className='underline font-bold'>Pesta Wirausaha Bone</span>
                      </h1>
              <p className="text-sm md:text-base text-black text-center">Silakan masuk untuk melanjutkan</p>
                    </div>

        <div className="w-full">
                      <Clerk.Connection name="google" asChild>
                        <Button
                          type="button"
                          disabled={isGlobalLoading}
                          variant="outline"
                          fullWidth
                          size={"big"}
                          className="bg-white border-gray-200 text-lg my-12"
                        >
                          <Clerk.Loading scope="provider:google">
                            {(isLoading) =>
                              isLoading ? (
                                <Icons.spinner className="size-5 animate-spin" />
                              ) : (
                                <>
                                  <div className="relative w-8 h-8 flex items-center justify-center">
                                    {/* colored google parts approximated with simple circles */}
                                    <Icons.google className="size-5" />
                                  </div>
                                  Lanjutkan dengan Google
                                </>
                              )
                            }
                          </Clerk.Loading>
                        </Button>
                      </Clerk.Connection>
                    </div>

                    {/* Continue (dark) button and sign up link */}
                    {/* <div className="w-full flex items-center justify-between mt-2">
                      <div />
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="default"
                          size="lg"
                          className="bg-[#313131] border border-gray-200 text-white w-full md:w-auto"
                        >
                          Continue
                        </Button>
                      </div>
                    </div> */}

                    <div className="w-full text-center mt-4">
                        <p className="text-sm md:text-base text-black">
                        Belum punya akun?{' '}
                        <a href="#" className="text-stone-950 font-bold underline">
                          Daftar sekarang
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </SignIn.Step>
          )}
        </Clerk.Loading>
      </SignIn.Root>
    </div>
  )
}