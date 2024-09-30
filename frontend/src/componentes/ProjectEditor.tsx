"use client"
import { useCreateProject, useUpdateProject } from "@/api/gen";
import { Button, Card, Flex, Grid, Stack, Switch, Textarea, TextInput, Text, Container, Group, Title } from "@mantine/core";
import { AxiosError } from "axios";
import { randomUUID, UUID } from "crypto";
import { useParams } from "next/navigation";
import { useState } from "react";
import Markdown from "react-markdown";



type ProjectEditorProps = {
    title: string,
    setTitle: (title: string) => void,
    description: string,
    setDescription: (description: string) => void,
    preview: boolean,
}

const ProjectEditor = ({title, setTitle, description, setDescription, preview} : ProjectEditorProps) => {

    return (
        <>
        <TextInput value={title} onChange={(event) => setTitle(event.currentTarget.value)} label="Title" />
            <Container w={"100%"} p={0}>

                <Text fw={700} mb={0}>Description</Text>
                {preview ? (
                    <Card withBorder >
                        <Markdown   >{description}</Markdown>

                    </Card>
                ) : (
                    <Textarea autosize h={"100%"} placeholder="In this project..." value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
                )}

        </Container>
    </>
    )
}



export {ProjectEditor}