import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDatabaseSchema } from "@/lib/database"

export async function DatabaseInfo() {
  const schema = await getDatabaseSchema()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Database Schema</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full">
          {schema.map((table) => (
            <AccordionItem value={table.name} key={table.name}>
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2 text-left">
                  <span>{table.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {table.rowCount} rows
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-2">
                <div className="space-y-1">
                  {table.columns.map((column) => (
                    <div key={column.name} className="text-sm flex justify-between">
                      <span className="font-mono">{column.name}</span>
                      <span className="text-muted-foreground">{column.type}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
