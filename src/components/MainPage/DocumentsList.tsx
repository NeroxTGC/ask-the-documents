import { deleteDocument, useQuery, getDocuments } from "wasp/client/operations";
import { Card, CardBody } from "@nextui-org/react";
import { Document } from "../../types";
import { DocumentCard } from "../DocumentCard";

export function DocumentsList() {
  const { data: documents, isLoading } = useQuery(getDocuments);
  
  return (
    <>
      <h2 className="text-2xl font-bold">Documents</h2>
      {documents && documents.length > 0 && (
        <div className="mt-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document as Document}
              onDelete={() => deleteDocument({ id: document.id })}
            />
          ))}
        </div>
      )}
      {isLoading && (
        <Card className="mt-4">
          <CardBody>
            <p>Loading...</p>
          </CardBody>
        </Card>
      )}
      {documents && documents.length === 0 && (
        <Card className="mt-4">
          <CardBody>
            <p>No documents yet.</p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
