"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React, { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

const Providers = (props: Props) => {
    return (
        <ClerkProvider>
            {props.children}
        </ClerkProvider>
    );
};

export default Providers;