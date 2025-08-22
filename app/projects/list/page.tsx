'use client';

import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import {
    MDBContainer,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBCardText,
    MDBSpinner,
    MDBRow,
    MDBCol,
    MDBInput,
    MDBTextArea,
    MDBBtn,
    MDBIcon, MDBNavbarLink,
} from 'mdb-react-ui-kit';
import axios from 'axios';
import {useSession} from 'next-auth/react';
import Header from "@/component/Header";
import LeftNavBar from "@/component/LeftNavBar";
import Footer from "@/component/Footer";
import Link from "next/link";

type Project = {
    id: string;
    projectName: string;
    embedWebsiteUrl: string;
    description?: string;
    createdAt?: string;
};

export default function ProjectList() {
    const {data: session} = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/projects/list', {
                headers: {Authorization: `Bearer ${session?.access_token}`},
            });
            setProjects(response.data || []);
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.access_token) {
            fetchProjects();
        }
    }, [session]);

    return (<>
            <Header/>
            <LeftNavBar/>
            <MDBContainer className='mt-5'>
                <h4 className='mb-4'>Your Chatbot Projects</h4>

                {/* New Project Form */}
                <MDBCard className='mb-4'>
                    <MDBCardBody>

                        <Link href="/projects/new" passHref legacyBehavior>
                            <MDBBtn color='primary' href="/projects/new">
                                <i className="fas fa-plus me-2"></i> Create Project
                            </MDBBtn>
                        </Link>
                    </MDBCardBody>
                </MDBCard>

                {/* Project Listing */}
                {loading ? (
                    <MDBSpinner color='primary' role='status'>
                        <span className='visually-hidden'>Loading...</span>
                    </MDBSpinner>
                ) : projects.length === 0 ? (
                    <p className='text-muted'>No projects found.</p>
                ) : (
                    <MDBRow className='gy-4'>
                        {projects.map((project) => (
                            <MDBCol md='6' lg='4' key={project.id}>
                                <MDBCard shadow='0' border='light' background='white' className='h-100'>
                                    <MDBCardBody>
                                        <MDBCardTitle>
                                            <Link href={`/projects/${project.id}`} className="text-decoration-none text-reset">
                                                <MDBIcon icon="robot" className="me-2 text-primary" />
                                                {project.projectName}
                                            </Link>
                                        </MDBCardTitle>
                                        <MDBCardText>
                                            <strong>Embed Site:</strong>{' '}
                                            <a href={project.embedWebsiteUrl} target='_blank' rel='noopener noreferrer'>
                                                {project.embedWebsiteUrl}
                                            </a>
                                            <br/>
                                            {project.description && (
                                                <>
                                                    <strong>Description:</strong> {project.description}
                                                    <br/>
                                                </>
                                            )}
                                            {project.createdAt && (
                                                <>
                                                    <strong>Created:</strong>{' '}
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </>
                                            )}
                                        </MDBCardText>
                                    </MDBCardBody>
                                </MDBCard>
                            </MDBCol>
                        ))}
                    </MDBRow>
                )}
            </MDBContainer>
            <Footer/>
        </>
    );
}
