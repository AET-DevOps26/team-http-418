package tum.devops.http418.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class DetailedCourseData {
	int id;
	String title_ger;
	String title_en;
	int sws;
	String description_ger;
	String description_en;
	String previous_knowledge_ger;
	String previous_knowledge_en;
	String course_objective_en;
	String course_objective_ger;
	String teaching_method_en;
	String teaching_method_ger;
	String registration_info;
	String course_type;
	String semester_key;
	String org_name_ger;
	String org_name_en;
	String org_url;
	List<Appointment> appointments;
	List<Person> people;
	List<CurriculumConnections> curriculumConnections;
}
