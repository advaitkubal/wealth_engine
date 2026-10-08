with open("src/components/Navbar.tsx", "r") as f:
    content = f.read()

content = content.replace("import LogoIcon from './LogoIcon'", "import LogoIcon from './LogoIcon'\nimport AirGapIndicator from './AirGapIndicator'")
content = content.replace("{/* CTA */}", "<div className=\"flex items-center gap-4\">\n          <AirGapIndicator />")
content = content.replace("</Link>\n      </div>", "</Link>\n        </div>\n      </div>")

with open("src/components/Navbar.tsx", "w") as f:
    f.write(content)
