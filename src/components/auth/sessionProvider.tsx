"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";

const SessionProviderComponent = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderComponent;
