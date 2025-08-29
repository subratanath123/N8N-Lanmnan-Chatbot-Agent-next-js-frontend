'use client';

import React from 'react';
import {
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBListGroup,
    MDBListGroupItem,
    MDBIcon,
    MDBBadge
} from 'mdb-react-ui-kit';
import {ProjectOverview} from "@/constants/Cosntants";


export default function SingleProjectOverview({overview}: { overview: ProjectOverview }) {
    const {project, projectTrainingInfoList} = overview;

    return (
        <MDBCard className='shadow-4 border rounded-4'>
            <MDBCardBody>
                <MDBCardTitle className='text-primary'>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                            src="/favicon.png" 
                            alt="Lanmnan" 
                            style={{ width: '20px', height: '20px' }}
                        />
                        <MDBIcon fas icon='project-diagram' className='me-2'/>
                        Crawl Progress: {project.projectName}
                    </div>
                </MDBCardTitle>

                <p className='text-muted'>
                    Total Pages Crawled: <strong>{projectTrainingInfoList.length}</strong>
                </p>

                <MDBListGroup flush style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {projectTrainingInfoList.map((info, index) => (
                        <MDBListGroupItem key={index} className='d-flex justify-content-between align-items-start'>
                            <div className='ms-2 me-auto'>
                                <div className='fw-bold text-break text-primary'>
                                    <MDBIcon fas icon='link' className='me-1'/>
                                    {info.childPageUrl}
                                </div>
                                <small className='text-muted'>
                                    Crawled: {new Date(info.created).toLocaleString()}
                                </small>
                            </div>
                            <MDBBadge color='info' pill>
                                {info.email}
                            </MDBBadge>
                        </MDBListGroupItem>
                    ))}
                </MDBListGroup>
            </MDBCardBody>
        </MDBCard>
    );
}
