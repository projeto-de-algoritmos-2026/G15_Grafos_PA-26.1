import json
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup

driver = webdriver.Chrome()


def main():
    try:
        driver.get("https://sigaa.unb.br/sigaa/public/home.jsf")
        driver.get("https://sigaa.unb.br/sigaa/public/turmas/listar.jsf?aba=p-ensino")

        dept_dropdown = driver.find_element(By.ID, "formTurma:inputDepto")
        Select(dept_dropdown).select_by_value("673")

        search_button = driver.find_element(By.NAME, "formTurma:j_id_jsp_1370969402_11")
        search_button.click()

        soup = BeautifulSoup(driver.page_source, "html.parser")

        table_rows = soup.find_all("tr", class_=["agrupador", "linhaPar", "linhaImpar"])

        current_subject = ""
        all_classes = []

        for row in table_rows:
            if "agrupador" in row["class"]:
                current_subject = row.find("span", class_="tituloDisciplina").get_text(strip=True)
                continue

            columns = row.find_all("td")

            if len(columns) >= 4:
                class_id = columns[0].get_text(strip=True)
                professor = columns[2].get_text(strip=True).split("(")[0].strip()
                raw_schedule = columns[3].find(string=True, recursive=False).split("(")[0].strip()
                location = columns[7].get_text(strip=True)

                class_data = {
                    "subject": current_subject,
                    "class_id": class_id,
                    "professor": professor,
                    "schedule": raw_schedule,
                    "location": location,
                }

                all_classes.append(class_data)

        with open("classes_data.json", "w", encoding="utf-8") as f:
            json.dump(all_classes, f, indent=4, ensure_ascii=False)

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
