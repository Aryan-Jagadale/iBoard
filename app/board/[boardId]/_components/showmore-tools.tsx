"use client"

import { Hint } from '@/components/hint'
import { Button } from '@/components/ui/button'
import { PencilRuler, ChevronRight, FilePenLine } from 'lucide-react';
import { useState } from 'react';
import Drawer from 'react-modern-drawer'
import 'react-modern-drawer/dist/index.css'
import Lottie from "react-lottie-player";
import groovyWalkAnimation from "@/public/workinprogress.json";


const ShowmoreTools = () => {
    const [openMenu, setopenMenu] = useState(false);
    const [isOpen, setIsOpen] = useState(false)
    const toggleDrawer = () => {
        setIsOpen((prevState) => !prevState)
    }

    const handleClick = () => {
        setopenMenu(!openMenu)
    }

    const handleClose = () => {
        setopenMenu(false)

    }
    return (
        <>
            {
                openMenu && (
                    <>
                        <div className='transition-opacity duration-300 opacity-100'>
                            <Hint label='Close'>
                                <Button onClick={handleClose} variant="board"
                                    size="icon">
                                    <ChevronRight />
                                </Button>
                            </Hint>
                            <Hint label='Text Editor'>
                                <Button onClick={toggleDrawer} variant="board"
                                    size="icon">
                                    <FilePenLine />
                                </Button>
                            </Hint>

                        </div>

                    </>
                )
            }
            {
                isOpen && (
                    <>
                        <Drawer
                            open={isOpen}
                            onClose={toggleDrawer}
                            direction='right'
                            style={{
                                width: "35vw"
                            }}
                        >
                            <div style={{
                                height: "100%",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap:"10px",
                                flexDirection:"column"
                            }}>
                                <h6 className='font-bold'>Currently, text editor is in progress!</h6>
                                <Lottie play loop animationData={groovyWalkAnimation} />

                            </div>
                        </Drawer>

                    </>
                )
            }

            <Hint label='More tools'>
                <Button onClick={handleClick} variant="board"
                    size="icon">
                    <PencilRuler />
                </Button>
            </Hint>


        </>


    )
}

export default ShowmoreTools