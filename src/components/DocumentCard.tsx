import { searchDocuments } from "wasp/client/operations";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  ScrollShadow,
  Button,
} from "@nextui-org/react";

import ReactMarkdown from "react-markdown";
import { LinkIcon } from "./LinkIcons";
import { Document } from "../types";

export function DocumentCard({
  document,
  onDelete,
  footerContent,
}: {
  document: Document;
  onDelete?: () => void;
  footerContent?: React.ReactNode;
}) {
  const content = document.sections?.map(s => s.content).join('\n\n') || '';

  return (
    <Card className="mt-2" key={document.id}>
      <CardHeader className="flex justify-between items-center">
        <div className="p-2">
          <h2 className="text-xl font-bold mb-1">{document.title}</h2>
          <p className="text-content4">
            <a
              href={document.url}
              target="_blank"
              className="flex items-center gap-1"
            >
              <LinkIcon size={16} /> {document.url}
            </a>
          </p>
        </div>
        {onDelete && (
          <div>
            <Button color="danger" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </CardHeader>
      <Divider />
      <CardBody>
        <ScrollShadow className="max-h-[200px]">
          <ReactMarkdown className="markdown">{content}</ReactMarkdown>
        </ScrollShadow>
      </CardBody>
      {footerContent && (
        <>
          <Divider />
          <CardFooter className="text-sm text-primary">
            {footerContent}
          </CardFooter>
        </>
      )}
    </Card>
  );
}
