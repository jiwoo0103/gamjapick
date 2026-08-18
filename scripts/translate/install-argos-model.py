"""Install the free Argos English-to-Korean package into project-local storage."""

import argostranslate.package


def main() -> None:
    argostranslate.package.update_package_index()
    package = next(
        (
            package
            for package in argostranslate.package.get_available_packages()
            if package.from_code == "en" and package.to_code == "ko"
        ),
        None,
    )
    if package is None:
        raise SystemExit("Could not find an Argos English-to-Korean package.")

    argostranslate.package.install_from_path(package.download())
    print("Installed Argos en -> ko package.")


if __name__ == "__main__":
    main()
