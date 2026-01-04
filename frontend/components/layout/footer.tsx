import Link from "next/link"
import { Building2, Github, Twitter, Linkedin, Mail } from "lucide-react"
import { FOOTER_NAV, SOCIAL_LINKS } from "@/lib/constants/navigation"
import { APP_NAME, APP_DESCRIPTION, APP_CONTACT_EMAIL } from "@/lib/constants/app"

const socialIconMap: Record<string, typeof Twitter> = {
  Twitter,
  Linkedin,
  Github,
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand column */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">{APP_NAME}</span>
              </Link>
              <p className="mt-4 text-sm text-gray-600">
                {APP_DESCRIPTION}
              </p>
              <div className="mt-6 flex space-x-4">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = socialIconMap[item.icon]
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">{item.name}</span>
                      {Icon && <Icon className="h-5 w-5" />}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Navigation columns - dynamically generated */}
            {FOOTER_NAV.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600">
              © {currentYear} {APP_NAME}. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href={`mailto:${APP_CONTACT_EMAIL}`}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>{APP_CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
