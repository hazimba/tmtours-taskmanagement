// scripts/generate-types.ts

import fs from "fs";
import path from "path";
import ts from "typescript";

const databasePath = path.join(process.cwd(), "app/types/database.ts");
const outputPath = path.join(process.cwd(), "app/types/index.ts");

const sourceText = fs.readFileSync(databasePath, "utf8");

const sourceFile = ts.createSourceFile(
  databasePath,
  sourceText,
  ts.ScriptTarget.Latest,
  true
);

type Column = {
  name: string;
  type: string;
};

type Relationship = {
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
};

const tables: Record<string, Column[]> = {};
const relationships: Record<string, Relationship[]> = {};
const enums: Record<string, string[]> = {};

const relationAliases: Record<string, string> = {
  company_id: "company",
  created_by: "creator",
  assigned_to: "assignee",
  parent_id: "parent",
  author_id: "author",
  user_id: "user",
  profile_id: "profile",
};

function toPascalCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function toSingular(value: string) {
  if (value.endsWith("ies")) return value.slice(0, -3) + "y";
  if (value.endsWith("s")) return value.slice(0, -1);
  return value;
}

function tableToInterfaceName(tableName: string) {
  return toPascalCase(toSingular(tableName));
}

function formatEnumKey(value: string) {
  return value.replace(/[^A-Z0-9_]/g, "_");
}

function getTypeText(node: ts.TypeNode): string {
  return node.getText(sourceFile).replaceAll("Json", "unknown");
}

function convertType(type: string) {
  return type.replace(
    /Database\["public"\]\["Enums"\]\["([^"]+)"\]/g,
    (_, enumName: string) => toPascalCase(enumName)
  );
}

function relationFieldName(columnName: string, referencedRelation: string) {
  if (relationAliases[columnName]) {
    return relationAliases[columnName];
  }

  if (columnName.endsWith("_id")) {
    return columnName.replace(/_id$/, "");
  }

  return toSingular(referencedRelation);
}

function visit(node: ts.Node) {
  if (ts.isPropertySignature(node) && ts.isIdentifier(node.name)) {
    const name = node.name.text;

    if (name === "Tables" && node.type && ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach((tableMember) => {
        if (
          !ts.isPropertySignature(tableMember) ||
          !ts.isIdentifier(tableMember.name) ||
          !tableMember.type ||
          !ts.isTypeLiteralNode(tableMember.type)
        ) {
          return;
        }

        const tableName = tableMember.name.text;

        const rowMember = tableMember.type.members.find(
          (member) =>
            ts.isPropertySignature(member) &&
            ts.isIdentifier(member.name) &&
            member.name.text === "Row"
        );

        if (
          rowMember &&
          ts.isPropertySignature(rowMember) &&
          rowMember.type &&
          ts.isTypeLiteralNode(rowMember.type)
        ) {
          tables[tableName] = rowMember.type.members
            .filter(
              (member): member is ts.PropertySignature =>
                ts.isPropertySignature(member) &&
                !!member.name &&
                ts.isIdentifier(member.name) &&
                !!member.type
            )
            .map((column) => ({
              name: (column.name as ts.Identifier).text,
              type: convertType(getTypeText(column.type!)),
            }));
        }

        const relationshipMember = tableMember.type.members.find(
          (member) =>
            ts.isPropertySignature(member) &&
            ts.isIdentifier(member.name) &&
            member.name.text === "Relationships"
        );

        if (
          relationshipMember &&
          ts.isPropertySignature(relationshipMember) &&
          relationshipMember.type &&
          ts.isTupleTypeNode(relationshipMember.type)
        ) {
          relationships[tableName] = relationshipMember.type.elements
            .map((element) => {
              if (!ts.isTypeLiteralNode(element)) return null;

              const relation: Relationship = {
                columns: [],
                referencedRelation: "",
                referencedColumns: [],
              };

              element.members.forEach((member) => {
                if (
                  !ts.isPropertySignature(member) ||
                  !ts.isIdentifier(member.name) ||
                  !member.type
                ) {
                  return;
                }

                const key = member.name.text;

                if (key === "columns" && ts.isTupleTypeNode(member.type)) {
                  relation.columns = member.type.elements
                    .map((el) =>
                      ts.isLiteralTypeNode(el) && ts.isStringLiteral(el.literal)
                        ? el.literal.text
                        : null
                    )
                    .filter((value): value is string => Boolean(value));
                }

                if (
                  key === "referencedRelation" &&
                  ts.isLiteralTypeNode(member.type) &&
                  ts.isStringLiteral(member.type.literal)
                ) {
                  relation.referencedRelation = member.type.literal.text;
                }

                if (
                  key === "referencedColumns" &&
                  ts.isTupleTypeNode(member.type)
                ) {
                  relation.referencedColumns = member.type.elements
                    .map((el) =>
                      ts.isLiteralTypeNode(el) && ts.isStringLiteral(el.literal)
                        ? el.literal.text
                        : null
                    )
                    .filter((value): value is string => Boolean(value));
                }
              });

              if (
                !relation.columns.length ||
                !relation.referencedRelation ||
                !relation.referencedColumns.length
              ) {
                return null;
              }

              return relation;
            })
            .filter((value): value is Relationship => Boolean(value));
        }
      });
    }

    if (name === "Enums" && node.type && ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach((enumMember) => {
        if (
          ts.isPropertySignature(enumMember) &&
          ts.isIdentifier(enumMember.name) &&
          enumMember.type &&
          ts.isUnionTypeNode(enumMember.type)
        ) {
          const enumName = enumMember.name.text;

          enums[enumName] = enumMember.type.types
            .filter(
              (typeNode): typeNode is ts.LiteralTypeNode =>
                ts.isLiteralTypeNode(typeNode) &&
                ts.isStringLiteral(typeNode.literal)
            )
            .map((typeNode) => (typeNode.literal as ts.StringLiteral).text);
        }
      });
    }
  }

  ts.forEachChild(node, visit);
}

visit(sourceFile);

const lines: string[] = [];

lines.push(`// This file is auto-generated by scripts/generate-types.ts`);
lines.push(`// Do not edit manually.`);
lines.push("");

Object.entries(enums).forEach(([enumName, values]) => {
  const enumTypeName = toPascalCase(enumName);

  lines.push(`export enum ${enumTypeName} {`);

  values.forEach((value) => {
    lines.push(`  ${formatEnumKey(value)} = "${value}",`);
  });

  lines.push(`}`);
  lines.push("");
});

Object.entries(tables).forEach(([tableName, columns]) => {
  const interfaceName = tableToInterfaceName(tableName);

  lines.push(`export interface ${interfaceName} {`);

  columns.forEach((column) => {
    lines.push(`  ${column.name}: ${column.type};`);
  });

  const usedRelationNames = new Set<string>();

  const tableRelationships = relationships[tableName] ?? [];

  tableRelationships.forEach((relation) => {
    const columnName = relation.columns[0];
    const baseRelationName = relationFieldName(
      columnName,
      relation.referencedRelation
    );

    let relationName = baseRelationName;

    if (usedRelationNames.has(relationName)) {
      relationName = columnName.endsWith("_id")
        ? columnName.replace(/_id$/, "")
        : columnName;
    }

    if (usedRelationNames.has(relationName)) return;

    usedRelationNames.add(relationName);

    const relationType = tableToInterfaceName(relation.referencedRelation);

    lines.push(`  ${relationName}?: ${relationType} | null;`);
  });

  lines.push(`}`);
  lines.push("");
});

lines.push(`export interface TaskAttachment {`);
lines.push(`  url: string;`);
lines.push(`  type: "IMAGE" | "PDF" | "DOC" | "EXCEL" | "OTHER";`);
lines.push(`  name?: string;`);
lines.push(`  uploaded_at?: string;`);
lines.push(`}`);

fs.writeFileSync(outputPath, lines.join("\n"));

console.log("✅ Clean interface types generated at app/types/index.ts");
