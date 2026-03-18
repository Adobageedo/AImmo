# Mode Opératoire - Ajout des ToolGroups Assistant-UI

## 📋 Objectif
Permettre au LLM d'utiliser et d'afficher les tools avec des ToolGroups pour une meilleure expérience utilisateur.

## 🚀 Étapes d'Installation

### 1. Installation du composant ToolGroup

```bash
npx shadcn@latest add tool-group
```

Cette commande va créer le fichier `/components/assistant-ui/tool-group.tsx`.

### 2. Configuration dans le Thread

Modifiez votre composant Thread pour intégrer ToolGroup :

```tsx
// Dans /components/assistant-ui/thread.tsx
import { ToolGroup } from "@/components/assistant-ui/tool-group";

const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.Parts
        components={{
          ToolGroup, // Ajout du composant ToolGroup
        }}
      />
    </MessagePrimitive.Root>
  );
};
```

### 3. Configuration des Tools pour le LLM

#### A. Définir les tools disponibles

Créez une configuration des tools dans `/lib/llm/tools.ts` :

```typescript
export const availableTools = {
  // Tool de recherche de propriétés
  search_properties: {
    name: "search_properties",
    description: "Rechercher des propriétés par critères",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "Ville de recherche" },
        min_price: { type: "number", description: "Prix minimum" },
        max_price: { type: "number", description: "Prix maximum" },
        property_type: { type: "string", enum: ["apartment", "house", "commercial"] }
      }
    }
  },
  
  // Tool de calcul de loyer
  calculate_rent: {
    name: "calculate_rent",
    description: "Calculer le loyer recommandé selon le marché",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Adresse du bien" },
        surface: { type: "number", description: "Surface en m²" },
        property_type: { type: "string", description: "Type de bien" }
      }
    }
  },
  
  // Tool d'analyse de bail
  analyze_lease: {
    name: "analyze_lease",
    description: "Analyser un document de bail",
    parameters: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "ID du document à analyser" }
      }
    }
  }
};
```

#### B. Configuration du LLM avec Tools

Dans votre configuration LLM (`/lib/llm/config.ts`) :

```typescript
import { availableTools } from './tools';

export const llmConfig = {
  model: "gpt-4-turbo-preview",
  tools: Object.values(availableTools),
  tool_choice: "auto", // Laisse le LLM décider d'utiliser les tools
  temperature: 0.1
};
```

### 4. Création d'UIs personnalisées pour les Tools

#### A. UI pour la recherche de propriétés

```tsx
// /components/assistant-ui/tools/PropertySearchTool.tsx
import { Building2, MapPin, Euro } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PropertySearchToolProps {
  city: string;
  results: Array<{
    id: string;
    name: string;
    address: string;
    price: number;
    type: string;
  }>;
}

export function PropertySearchTool({ city, results }: PropertySearchToolProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">Propriétés à {city}</h3>
        <span className="text-sm text-muted-foreground">({results.length} résultats)</span>
      </div>
      
      <div className="space-y-2">
        {results.map((property) => (
          <div key={property.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{property.name}</p>
                <p className="text-sm text-muted-foreground">{property.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{property.price}€/mois</p>
              <p className="text-xs text-muted-foreground">{property.type}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

#### B. UI pour le calcul de loyer

```tsx
// /components/assistant-ui/tools/RentCalculatorTool.tsx
import { Calculator, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RentCalculatorToolProps {
  address: string;
  surface: number;
  recommended_rent: number;
  market_range: {
    min: number;
    max: number;
  };
}

export function RentCalculatorTool({ address, surface, recommended_rent, market_range }: RentCalculatorToolProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-green-500" />
        <h3 className="font-medium">Calcul de loyer recommandé</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Adresse</p>
          <p className="font-medium">{address}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Surface</p>
            <p className="font-medium">{surface} m²</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Loyer/m²</p>
            <p className="font-medium">{Math.round(recommended_rent / surface)}€</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">Loyer recommandé</p>
            <Badge variant="default">{recommended_rent}€/mois</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Marché: {market_range.min}€ - {market_range.max}€/mois</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

### 5. Intégration avec le système de Chat

#### A. Handler des Tools

```typescript
// /lib/llm/tool-handlers.ts
import { searchProperties, calculateRent, analyzeLease } from '@/services/ai-tools';

export const toolHandlers = {
  search_properties: async (args: any) => {
    const results = await searchProperties(args);
    return {
      tool: "PropertySearchTool",
      props: {
        city: args.city,
        results: results.properties
      }
    };
  },
  
  calculate_rent: async (args: any) => {
    const calculation = await calculateRent(args);
    return {
      tool: "RentCalculatorTool",
      props: {
        address: args.address,
        surface: args.surface,
        recommended_rent: calculation.recommended_rent,
        market_range: calculation.market_range
      }
    };
  },
  
  analyze_lease: async (args: any) => {
    const analysis = await analyzeLease(args.document_id);
    return {
      tool: "LeaseAnalysisTool",
      props: analysis
    };
  }
};
```

#### B. Intégration dans le Chat

```tsx
// /components/assistant-ui/chat.tsx
import { toolHandlers } from '@/lib/llm/tool-handlers';
import { PropertySearchTool } from './tools/PropertySearchTool';
import { RentCalculatorTool } from './tools/RentCalculatorTool';

const toolComponents = {
  PropertySearchTool,
  RentCalculatorTool,
  // Ajouter d'autres tools ici
};

export function ChatInterface() {
  const [messages, setMessages] = useState([]);
  
  const handleToolCall = async (toolName: string, args: any) => {
    const handler = toolHandlers[toolName];
    if (!handler) return null;
    
    const result = await handler(args);
    return result;
  };
  
  return (
    <div>
      {/* Votre interface de chat existante */}
      {/* Les ToolGroups s'afficheront automatiquement quand le LLM utilise des tools */}
    </div>
  );
}
```

### 6. Configuration des variants (optionnel)

Pour changer le style des ToolGroups :

```tsx
// Dans votre thread.tsx
<ToolGroup.Root variant="outline" defaultOpen>
  <ToolGroup.Trigger count={3} />
  <ToolGroup.Content>
    {/* Contenu des tools */}
  </ToolGroup.Content>
</ToolGroup.Root>
```

Variants disponibles :
- `default` : Style de base
- `outline` : Bordure arrondie
- `muted` : Fond muted avec bordure

## 🎯 Résultat attendu

Une fois configuré, lorsque le LLM utilisera des tools, ils s'afficheront dans des ToolGroups :

1. **Groupement automatique** des tools consécutifs
2. **Interface collapsible** avec compteur de tools
3. **UIs personnalisées** pour chaque type de tool
4. **Loading states** pendant l'exécution
5. **Animation fluide** à l'ouverture/fermeture

## 🔧 Dépannage

### Tools ne s'affichent pas
- Vérifiez que `ToolGroup` est bien ajouté dans `MessagePrimitive.Parts`
- Confirmez que les tools sont bien configurés dans la config LLM

### UI personnalisée ne fonctionne pas
- Vérifiez que les composants sont bien importés
- Assurez-vous que les noms de tools correspondent dans les handlers

### Performance
- Les ToolGroups sont optimisés pour gérer de nombreux tools
- Utilisez `defaultOpen={false}` pour garder les groupes fermés par défaut

## 📚 Références

- [Documentation Assistant-UI ToolGroup](https://www.assistant-ui.com/docs/ui/tool-group)
- [Composants associés](https://www.assistant-ui.com/docs/ui/tool-fallback)
