import type { PropsWithChildren } from "react";

interface PageHeaderProps extends PropsWithChildren {
  title: string;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {children}
    </header>
  );
}
