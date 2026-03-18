export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center p-4 pt-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">AImmo</h1>
            <p className="text-muted-foreground">Gestion immobilière simplifiée</p>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
}
